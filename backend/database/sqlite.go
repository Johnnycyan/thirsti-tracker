package database

import (
	"log"
	"os"
	"path/filepath"

	"thirsti-tracker/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	var err error

	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "data/thirsti.db"
	}

	// Ensure the directory exists
	dir := filepath.Dir(dbPath)
	if dir != "" && dir != "." {
		err = os.MkdirAll(dir, os.ModePerm)
		if err != nil {
			log.Fatal("Failed to create database directory:", err)
		}
	}

	DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
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
