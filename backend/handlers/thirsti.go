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

// GetInventory returns active (non-consumed) tanks and pods.
func GetInventory(c *gin.Context) {
	var co2Tanks []models.CO2Tank
	var flavorPods []models.FlavorPod

	// Exclude consumed flavor pods from the active inventory
	database.DB.Where("status != ?", models.TankConsumed).Find(&co2Tanks)
	database.DB.Where("status != ?", models.PodConsumed).Find(&flavorPods)

	c.JSON(http.StatusOK, gin.H{
		"co2_tanks":   co2Tanks,
		"flavor_pods": flavorPods,
	})
}

// GetFlavorArchive returns only consumed (archived) flavor pods.
func GetFlavorArchive(c *gin.Context) {
	var consumed []models.FlavorPod
	database.DB.Where("status = ?", models.PodConsumed).Order("consumed_at desc").Find(&consumed)
	c.JSON(http.StatusOK, gin.H{"archived_pods": consumed})
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

type RefillCO2Request struct {
	Cost float64 `json:"cost"`
}

// RefillCO2 records a refill event for the specified CO2 tank.
// It saves the current doses_used snapshot into CO2RefillLog,
// then resets doses_used to 0 so usage tracking starts fresh.
func RefillCO2(c *gin.Context) {
	id := c.Param("id")
	var req RefillCO2Request
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var tank models.CO2Tank
	if err := database.DB.First(&tank, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "CO2 tank not found"})
		return
	}

	// Log the refill event (captures doses used before refill)
	refill := models.CO2RefillLog{
		CO2TankID:         tank.ID,
		DosesBeforeRefill: tank.DosesUsed,
		Cost:              req.Cost,
		RefilledAt:        time.Now(),
	}
	database.DB.Create(&refill)

	// Reset usage counter and update cost for the refill
	tank.DosesUsed = 0
	tank.Cost = req.Cost
	database.DB.Save(&tank)

	c.JSON(http.StatusOK, gin.H{"message": "CO2 tank refilled successfully", "refill": refill})
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
	// move currently installed back to extra
	var installed models.FlavorPod
	if err := database.DB.Where("status = ?", models.PodInstalled).First(&installed).Error; err == nil {
		installed.Status = models.PodExtra
		installed.ConsumedAt = nil
		database.DB.Save(&installed)
	}

	pod.Status = models.PodInstalled
	pod.InstalledAt = &now
	database.DB.Save(&pod)

	c.JSON(http.StatusOK, gin.H{"message": "Flavor pod installed successfully"})
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

	// stats - consumed items
	var consumedCO2 []models.CO2Tank
	database.DB.Where("status = ?", models.TankExtraEmpty).Or("status = ?", models.TankConsumed).Find(&consumedCO2)

	var consumedFlavor []models.FlavorPod
	database.DB.Where("status = ?", models.PodConsumed).Find(&consumedFlavor)

	// CO2 refill logs (for dose tracking across refills)
	var refillLogs []models.CO2RefillLog
	database.DB.Find(&refillLogs)

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
		// Also count doses from refill logs for the same tanks
		for _, r := range refillLogs {
			totalDoses += r.DosesBeforeRefill
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

	// Spending stats
	// All CO2 tanks (any status) - get their costs
	var allCO2Tanks []models.CO2Tank
	database.DB.Unscoped().Where("deleted_at IS NULL").Find(&allCO2Tanks)
	var allFlavorPods []models.FlavorPod
	database.DB.Unscoped().Where("deleted_at IS NULL").Find(&allFlavorPods)

	totalCO2Spent := 0.0
	for _, t := range allCO2Tanks {
		totalCO2Spent += t.Cost
	}
	// Also include refill costs
	totalRefillSpent := 0.0
	for _, r := range refillLogs {
		totalRefillSpent += r.Cost
	}
	totalCO2Spent += totalRefillSpent

	totalFlavorSpent := 0.0
	for _, p := range allFlavorPods {
		totalFlavorSpent += p.Cost
	}

	totalSpent := totalCO2Spent + totalFlavorSpent

	avgCostPerFlavorPod := 0.0
	if len(allFlavorPods) > 0 {
		avgCostPerFlavorPod = totalFlavorSpent / float64(len(allFlavorPods))
	}

	// avg cost per CO2 (count unique tank purchases + refills)
	co2PurchaseCount := len(allCO2Tanks) + len(refillLogs)
	avgCostPerCO2 := 0.0
	if co2PurchaseCount > 0 {
		avgCostPerCO2 = totalCO2Spent / float64(co2PurchaseCount)
	}

	// avg cost per dose (only if we have consumed data)
	avgCostPerFlavorDose := 0.0
	avgCostPerCO2Dose := 0.0

	if len(consumedFlavor) > 0 {
		totalFlavorDoses := 0
		for _, p := range consumedFlavor {
			totalFlavorDoses += p.DosesUsed
		}
		if totalFlavorDoses > 0 {
			// Only count cost of consumed pods for this metric
			consumedFlavorCost := 0.0
			for _, p := range consumedFlavor {
				consumedFlavorCost += p.Cost
			}
			avgCostPerFlavorDose = consumedFlavorCost / float64(totalFlavorDoses)
		}
	}

	if len(consumedCO2) > 0 {
		totalCO2Doses := 0
		for _, t := range consumedCO2 {
			totalCO2Doses += t.DosesUsed
		}
		for _, r := range refillLogs {
			totalCO2Doses += r.DosesBeforeRefill
		}
		if totalCO2Doses > 0 {
			consumedCO2Cost := 0.0
			for _, t := range consumedCO2 {
				consumedCO2Cost += t.Cost
			}
			consumedCO2Cost += totalRefillSpent
			avgCostPerCO2Dose = consumedCO2Cost / float64(totalCO2Doses)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"current_co2":    currentCO2,
		"current_flavor": currentFlavor,
		"inventory": gin.H{
			"co2_full":     extraFullCO2,
			"co2_empty":    extraEmptyCO2,
			"flavor_extra": extraFlavor,
		},
		"analytics": gin.H{
			"avg_co2_doses":    math.Round(avgCO2Doses),
			"avg_co2_days":     math.Round(avgCO2Days*10) / 10,
			"avg_flavor_doses": math.Round(avgFlavorDoses),
			"avg_flavor_days":  math.Round(avgFlavorDays*10) / 10,
		},
		"spending": gin.H{
			"total_spent":              math.Round(totalSpent*100) / 100,
			"total_co2_spent":          math.Round(totalCO2Spent*100) / 100,
			"total_flavor_spent":       math.Round(totalFlavorSpent*100) / 100,
			"avg_cost_per_flavor_pod":  math.Round(avgCostPerFlavorPod*100) / 100,
			"avg_cost_per_co2":         math.Round(avgCostPerCO2*100) / 100,
			"avg_cost_per_flavor_dose": math.Round(avgCostPerFlavorDose*1000) / 1000,
			"avg_cost_per_co2_dose":    math.Round(avgCostPerCO2Dose*1000) / 1000,
			"has_flavor_dose_data":     len(consumedFlavor) > 0,
			"has_co2_dose_data":        len(consumedCO2) > 0,
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
		"all_dispenses":    allLogs,
		"co2_history":      co2Tanks,
		"flavor_history":   flavorPods,
	})
}

// GetAdminLogs returns all dispense logs for the admin (paginated by newest).
func GetAdminLogs(c *gin.Context) {
	var logs []models.DispenseLog
	database.DB.Order("created_at desc").Find(&logs)
	c.JSON(http.StatusOK, gin.H{"logs": logs})
}

type UpdateDispenseLogRequest struct {
	SparkleLevel int   `json:"sparkle_level"`
	FlavorLevel  int   `json:"flavor_level"`
	SizeOz       int   `json:"size_oz"`
	CO2Doses     int   `json:"co2_doses"`
	FlavorDoses  int   `json:"flavor_doses"`
	FlavorPodID  *uint `json:"flavor_pod_id"`
}

func UpdateDispenseLog(c *gin.Context) {
	id := c.Param("id")
	var req UpdateDispenseLogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var log models.DispenseLog
	if err := database.DB.First(&log, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Log not found"})
		return
	}
	log.SparkleLevel = req.SparkleLevel
	log.FlavorLevel = req.FlavorLevel
	log.SizeOz = req.SizeOz
	log.CO2Doses = req.CO2Doses
	log.FlavorDoses = req.FlavorDoses
	log.FlavorPodID = req.FlavorPodID
	database.DB.Save(&log)
	c.JSON(http.StatusOK, log)
}

func DeleteDispenseLog(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&models.DispenseLog{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete log"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Log deleted"})
}

// GetExtraFlavors returns available flavor options for the submission page.
func GetExtraFlavors(c *gin.Context) {
	code := c.Query("code")
	if !validateCode(code) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid code"})
		return
	}

	// Get currently installed flavor
	var installed models.FlavorPod
	var installedResult *gin.H
	if err := database.DB.Where("status = ?", models.PodInstalled).First(&installed).Error; err == nil {
		installedResult = &gin.H{"name": installed.Name, "color_hex": installed.ColorHex}
	}

	// Get distinct flavor names from extra pods
	var extras []models.FlavorPod
	database.DB.Where("status = ?", models.PodExtra).Find(&extras)

	seen := map[string]bool{}
	var uniqueExtras []gin.H
	for _, p := range extras {
		if !seen[p.Name] {
			seen[p.Name] = true
			uniqueExtras = append(uniqueExtras, gin.H{"name": p.Name, "color_hex": p.ColorHex})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"installed": installedResult,
		"extras":    uniqueExtras,
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
	SparkleLevel int    `json:"sparkle_level"`
	FlavorLevel  int    `json:"flavor_level"`
	SizeOz       int    `json:"size_oz"`
	FlavorName   string `json:"flavor_name"`
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

	// Determine which flavor pod to use
	var flavorPodID *uint
	if flavorDoses > 0 {
		var currentFlavor models.FlavorPod
		hasInstalled := database.DB.Where("status = ?", models.PodInstalled).First(&currentFlavor).Error == nil

		if req.FlavorName != "" && (!hasInstalled || currentFlavor.Name != req.FlavorName) {
			// User selected a different flavor — find an extra pod of that flavor
			// Prefer one with doses_used > 0 (already partially used)
			var candidate models.FlavorPod
			err := database.DB.Where("status = ? AND name = ? AND doses_used > 0", models.PodExtra, req.FlavorName).
				First(&candidate).Error
			if err != nil {
				// Fall back to any extra pod of that flavor
				err = database.DB.Where("status = ? AND name = ?", models.PodExtra, req.FlavorName).
					First(&candidate).Error
			}
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "No extra pods available for flavor: " + req.FlavorName})
				return
			}

			now := time.Now()
			// Move currently installed back to extra
			if hasInstalled {
				currentFlavor.Status = models.PodExtra
				currentFlavor.ConsumedAt = nil
				database.DB.Save(&currentFlavor)
			}
			// Install the candidate
			candidate.Status = models.PodInstalled
			candidate.InstalledAt = &now
			database.DB.Save(&candidate)
			currentFlavor = candidate
		}

		if currentFlavor.ID != 0 {
			currentFlavor.DosesUsed += flavorDoses
			database.DB.Save(&currentFlavor)
			flavorPodID = &currentFlavor.ID
		}
	}

	// Log it
	log := models.DispenseLog{
		SparkleLevel: req.SparkleLevel,
		FlavorLevel:  req.FlavorLevel,
		SizeOz:       req.SizeOz,
		CO2Doses:     co2Doses,
		FlavorDoses:  flavorDoses,
		FlavorPodID:  flavorPodID,
	}
	database.DB.Create(&log)

	// Update currently installed CO2 tank
	if co2Doses > 0 {
		var currentCO2 models.CO2Tank
		if err := database.DB.Where("status = ?", models.TankInstalled).First(&currentCO2).Error; err == nil {
			currentCO2.DosesUsed += co2Doses
			database.DB.Save(&currentCO2)
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
