package database

import (
	"log"

	"blankapp/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	var err error
	DB, err = gorm.Open(sqlite.Open("thirsti.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Auto migrate models
	err = DB.AutoMigrate(&models.User{}, &models.ThemeColors{}, &models.MachineSettings{}, &models.CO2Tank{}, &models.FlavorPod{}, &models.AdminConfig{}, &models.DispenseLog{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	log.Println("Database connected and migrated")
}

