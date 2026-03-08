package handlers

import (
	"net/http"

	"blankapp/database"
	"blankapp/models"

	"github.com/gin-gonic/gin"
)

func GetThemeColors(c *gin.Context) {
	userID := c.GetUint("user_id")

	var colors models.ThemeColors
	if result := database.DB.Where("user_id = ?", userID).First(&colors); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No theme colors found"})
		return
	}

	c.JSON(http.StatusOK, colors)
}

func SetThemeColors(c *gin.Context) {
	userID := c.GetUint("user_id")

	var colors models.ThemeColors
	if err := c.ShouldBindJSON(&colors); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	colors.UserID = userID

	// Upsert: update if exists, create if not
	var existing models.ThemeColors
	if result := database.DB.Where("user_id = ?", userID).First(&existing); result.Error == nil {
		colors.ID = existing.ID
		database.DB.Save(&colors)
	} else {
		database.DB.Create(&colors)
	}

	c.JSON(http.StatusOK, colors)
}
