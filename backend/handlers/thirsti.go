package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"math"
	"net/http"
	"time"

	"thirsti-tracker/database"
	"thirsti-tracker/models"

	"github.com/gin-gonic/gin"
)

// Generate a new code for the submission page
func GenerateCode(c *gin.Context) {
	bytes := make([]byte, 4)
	if _, err := rand.Read(bytes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate code"})
		return
	}
	code := hex.EncodeToString(bytes)[:4]

	var config models.AdminConfig
	if err := database.DB.First(&config).Error; err != nil {
		config = models.AdminConfig{SubmissionCode: code}
		database.DB.Create(&config)
	} else {
		config.SubmissionCode = code
		database.DB.Save(&config)
	}

	c.JSON(http.StatusOK, gin.H{"code": code})
}

func GetCode(c *gin.Context) {
	var config models.AdminConfig
	if err := database.DB.First(&config).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"code": ""})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": config.SubmissionCode})
}

// Admin stats
func GetInventory(c *gin.Context) {
	var co2Tanks []models.CO2Tank
	var flavorPods []models.FlavorPod

	database.DB.Find(&co2Tanks)
	database.DB.Find(&flavorPods)

	c.JSON(http.StatusOK, gin.H{
		"co2_tanks":   co2Tanks,
		"flavor_pods": flavorPods,
	})
}

type PurchaseCO2Request struct {
	Quantity int     `json:"quantity"`
	CostInfo float64 `json:"cost"`
}

func PurchaseCO2(c *gin.Context) {
	var req PurchaseCO2Request
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var newTanks []models.CO2Tank
	for i := 0; i < req.Quantity; i++ {
		tank := models.CO2Tank{
			Status: models.TankExtraFull,
			Cost:   req.CostInfo / float64(req.Quantity),
		}
		newTanks = append(newTanks, tank)
	}
	if len(newTanks) > 0 {
		database.DB.Create(&newTanks)
	}
	c.JSON(http.StatusOK, gin.H{"message": "CO2 purchased successfully"})
}

func InstallCO2(c *gin.Context) {
	// find currently installed and set to empty
	var installed models.CO2Tank
	now := time.Now()
	if err := database.DB.Where("status = ?", models.TankInstalled).First(&installed).Error; err == nil {
		installed.Status = models.TankExtraEmpty
		installed.ConsumedAt = &now
		database.DB.Save(&installed)
	}

	// install an extra full one
	var extraFull models.CO2Tank
	if err := database.DB.Where("status = ?", models.TankExtraFull).First(&extraFull).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No extra full CO2 tanks available"})
		return
	}

	extraFull.Status = models.TankInstalled
	extraFull.InstalledAt = &now
	database.DB.Save(&extraFull)

	c.JSON(http.StatusOK, gin.H{"message": "CO2 installed successfully"})
}

type PurchaseFlavorRequest struct {
	Quantity int     `json:"quantity"`
	CostInfo float64 `json:"cost"`
	Name     string  `json:"name"`
	ColorHex string  `json:"color_hex"`
}

func PurchaseFlavor(c *gin.Context) {
	var req PurchaseFlavorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var newPods []models.FlavorPod
	for i := 0; i < req.Quantity; i++ {
		pod := models.FlavorPod{
			Status:   models.PodExtra,
			Cost:     req.CostInfo / float64(req.Quantity),
			Name:     req.Name,
			ColorHex: req.ColorHex,
		}
		newPods = append(newPods, pod)
	}
	if len(newPods) > 0 {
		database.DB.Create(&newPods)
	}
	c.JSON(http.StatusOK, gin.H{"message": "Flavor pods purchased successfully"})
}

func InstallFlavor(c *gin.Context) {
	podID := c.Param("id")

	var pod models.FlavorPod
	if err := database.DB.First(&pod, podID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Flavor pod not found"})
		return
	}

	if pod.Status != models.PodExtra {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pod is not extra"})
		return
	}

	now := time.Now()
	// consume currently installed
	var installed models.FlavorPod
	if err := database.DB.Where("status = ?", models.PodInstalled).First(&installed).Error; err == nil {
		installed.Status = models.PodConsumed
		installed.ConsumedAt = &now
		database.DB.Save(&installed)
	}

	pod.Status = models.PodInstalled
	pod.InstalledAt = &now
	database.DB.Save(&pod)

	c.JSON(http.StatusOK, gin.H{"message": "Flavor pod installed successfully"})
}

func DeleteCO2(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&models.CO2Tank{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

type UpdateCO2Request struct {
	Status    models.CO2TankStatus `json:"status"`
	DosesUsed int                  `json:"doses_used"`
}

func UpdateCO2(c *gin.Context) {
	id := c.Param("id")
	var req UpdateCO2Request
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var tank models.CO2Tank
	if err := database.DB.First(&tank, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	tank.Status = req.Status
	tank.DosesUsed = req.DosesUsed
	database.DB.Save(&tank)
	c.JSON(http.StatusOK, tank)
}

func DeleteFlavor(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&models.FlavorPod{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

type UpdateFlavorRequest struct {
	Name      string                 `json:"name"`
	ColorHex  string                 `json:"color_hex"`
	Status    models.FlavorPodStatus `json:"status"`
	DosesUsed int                    `json:"doses_used"`
}

func UpdateFlavor(c *gin.Context) {
	id := c.Param("id")
	var req UpdateFlavorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var pod models.FlavorPod
	if err := database.DB.First(&pod, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	pod.Name = req.Name
	pod.ColorHex = req.ColorHex
	pod.Status = req.Status
	pod.DosesUsed = req.DosesUsed
	database.DB.Save(&pod)
	c.JSON(http.StatusOK, pod)
}

// Dashboard public stats 
func GetDashboard(c *gin.Context) {
	// get currently installed CO2
	var currentCO2 models.CO2Tank
	database.DB.Where("status = ?", models.TankInstalled).First(&currentCO2)

	// get currently installed flavor
	var currentFlavor models.FlavorPod
	database.DB.Where("status = ?", models.PodInstalled).First(&currentFlavor)

	// extra items
	var extraFullCO2 []models.CO2Tank
	var extraEmptyCO2 []models.CO2Tank
	var extraFlavor []models.FlavorPod
	database.DB.Where("status = ?", models.TankExtraFull).Find(&extraFullCO2)
	database.DB.Where("status = ?", models.TankExtraEmpty).Find(&extraEmptyCO2)
	database.DB.Where("status = ?", models.PodExtra).Find(&extraFlavor)

	// stats
	var consumedCO2 []models.CO2Tank
	database.DB.Where("status = ?", models.TankExtraEmpty).Or("status = ?", models.TankConsumed).Find(&consumedCO2)

	var consumedFlavor []models.FlavorPod
	database.DB.Where("status = ?", models.PodConsumed).Find(&consumedFlavor)

	avgCO2Doses := 0.0
	avgCO2Days := 0.0
	if len(consumedCO2) > 0 {
		totalDoses := 0
		totalDays := 0.0
		validCount := 0
		for _, v := range consumedCO2 {
			totalDoses += v.DosesUsed
			if v.InstalledAt != nil && v.ConsumedAt != nil {
				totalDays += v.ConsumedAt.Sub(*v.InstalledAt).Hours() / 24.0
				validCount++
			}
		}
		avgCO2Doses = float64(totalDoses) / float64(len(consumedCO2))
		if validCount > 0 {
			avgCO2Days = totalDays / float64(validCount)
		}
	}

	avgFlavorDoses := 0.0
	avgFlavorDays := 0.0
	if len(consumedFlavor) > 0 {
		totalDoses := 0
		totalDays := 0.0
		validCount := 0
		for _, v := range consumedFlavor {
			totalDoses += v.DosesUsed
			if v.InstalledAt != nil && v.ConsumedAt != nil {
				totalDays += v.ConsumedAt.Sub(*v.InstalledAt).Hours() / 24.0
				validCount++
			}
		}
		avgFlavorDoses = float64(totalDoses) / float64(len(consumedFlavor))
		if validCount > 0 {
			avgFlavorDays = totalDays / float64(validCount)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"current_co2": currentCO2,
		"current_flavor": currentFlavor,
		"inventory": gin.H{
			"co2_full": extraFullCO2,
			"co2_empty": extraEmptyCO2,
			"flavor_extra": extraFlavor,
		},
		"analytics": gin.H{
			"avg_co2_doses": math.Round(avgCO2Doses),
			"avg_co2_days": math.Round(avgCO2Days*10)/10,
			"avg_flavor_doses": math.Round(avgFlavorDoses),
			"avg_flavor_days": math.Round(avgFlavorDays*10)/10,
		},
	})
}

func GetAnalytics(c *gin.Context) {
	var logs []models.DispenseLog
	database.DB.Order("created_at desc").Limit(100).Find(&logs)

	var allLogs []models.DispenseLog
	database.DB.Order("created_at asc").Find(&allLogs)

	var co2Tanks []models.CO2Tank
	database.DB.Order("installed_at desc").Find(&co2Tanks)

	var flavorPods []models.FlavorPod
	database.DB.Order("installed_at desc").Find(&flavorPods)

	c.JSON(http.StatusOK, gin.H{
		"recent_dispenses": logs,
		"all_dispenses": allLogs,
		"co2_history": co2Tanks,
		"flavor_history": flavorPods,
	})
}

// Submission Logic
func validateCode(code string) bool {
	var config models.AdminConfig
	if err := database.DB.First(&config).Error; err != nil {
		return false
	}
	return config.SubmissionCode == code
}

func GetMachineSettings(c *gin.Context) {
	code := c.Query("code")
	if !validateCode(code) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid code"})
		return
	}

	var settings models.MachineSettings
	if err := database.DB.First(&settings).Error; err != nil {
		// initialize default
		settings = models.MachineSettings{SparkleLevel: 2, FlavorLevel: 1, SizeOz: 12}
		database.DB.Create(&settings)
	}

	c.JSON(http.StatusOK, settings)
}

type DispenseRequest struct {
	SparkleLevel int `json:"sparkle_level"`
	FlavorLevel  int `json:"flavor_level"`
	SizeOz       int `json:"size_oz"`
}

func Dispense(c *gin.Context) {
	code := c.Query("code")
	if !validateCode(code) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid code"})
		return
	}

	var req DispenseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Calculate doses
	dosesBase := 0
	dosesFlavorBase := 0
	switch req.SizeOz {
	case 6:
		dosesBase = 1
		dosesFlavorBase = 1
	case 12:
		dosesBase = 2
		dosesFlavorBase = 1
	case 18:
		dosesBase = 3
		dosesFlavorBase = 2
	case 24:
		dosesBase = 4
		dosesFlavorBase = 2
	}

	co2Multiplier := req.SparkleLevel  // 0, 1, 2, 3
	flavorMultiplier := req.FlavorLevel // 0, 1, 2

	co2Doses := dosesBase * co2Multiplier
	flavorDoses := dosesFlavorBase * flavorMultiplier

	// Log it
	log := models.DispenseLog{
		SparkleLevel: req.SparkleLevel,
		FlavorLevel: req.FlavorLevel,
		SizeOz: req.SizeOz,
		CO2Doses: co2Doses,
		FlavorDoses: flavorDoses,
	}
	database.DB.Create(&log)

	// Update currently installed Tanks/Pods
	if co2Doses > 0 {
		var currentCO2 models.CO2Tank
		if err := database.DB.Where("status = ?", models.TankInstalled).First(&currentCO2).Error; err == nil {
			currentCO2.DosesUsed += co2Doses
			database.DB.Save(&currentCO2)
		}
	}

	if flavorDoses > 0 {
		var currentFlavor models.FlavorPod
		if err := database.DB.Where("status = ?", models.PodInstalled).First(&currentFlavor).Error; err == nil {
			currentFlavor.DosesUsed += flavorDoses
			database.DB.Save(&currentFlavor)
		}
	}

	// Save settings
	var settings models.MachineSettings
	if err := database.DB.First(&settings).Error; err == nil {
		settings.SparkleLevel = req.SparkleLevel
		settings.FlavorLevel = req.FlavorLevel
		settings.SizeOz = req.SizeOz
		database.DB.Save(&settings)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Dispense logged successfully"})
}

