package models

import (
	"time"

	"gorm.io/gorm"
)

type CO2TankStatus string
const (
	TankExtraFull  CO2TankStatus = "extra_full"
	TankExtraEmpty CO2TankStatus = "extra_empty"
	TankInstalled  CO2TankStatus = "installed"
	TankConsumed   CO2TankStatus = "consumed"
)

type FlavorPodStatus string
const (
	PodExtra     FlavorPodStatus = "extra"
	PodInstalled FlavorPodStatus = "installed"
	PodConsumed  FlavorPodStatus = "consumed"
)

type MachineSettings struct {
	ID           uint      `gorm:"primarykey"`
	SparkleLevel int       `json:"sparkle_level"` // 0-3 (0 is still)
	FlavorLevel  int       `json:"flavor_level"`  // 0-2 (0 is no flavor)
	SizeOz       int       `json:"size_oz"`       // 6, 12, 18, 24
	UpdatedAt    time.Time `json:"updated_at"`
}

type CO2Tank struct {
	ID           uint          `gorm:"primarykey" json:"id"`
	Status       CO2TankStatus `json:"status"`
	DosesUsed    int           `json:"doses_used"`
	Cost         float64       `json:"cost"`
	InstalledAt  *time.Time    `json:"installed_at"`
	ConsumedAt   *time.Time    `json:"consumed_at"`
	CreatedAt    time.Time     `json:"created_at"`
	UpdatedAt    time.Time     `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

type FlavorPod struct {
	ID           uint            `gorm:"primarykey" json:"id"`
	Name         string          `json:"name"`
	ColorHex     string          `json:"color_hex"`
	Status       FlavorPodStatus `json:"status"`
	DosesUsed    int             `json:"doses_used"`
	Cost         float64         `json:"cost"`
	InstalledAt  *time.Time      `json:"installed_at"`
	ConsumedAt   *time.Time      `json:"consumed_at"`
	CreatedAt    time.Time       `json:"created_at"`
	UpdatedAt    time.Time       `json:"updated_at"`
	DeletedAt    gorm.DeletedAt  `gorm:"index" json:"-"`
}

type AdminConfig struct {
	ID             uint   `gorm:"primarykey"`
	SubmissionCode string `json:"submission_code"`
}

type DispenseLog struct {
	ID           uint      `gorm:"primarykey" json:"id"`
	SparkleLevel int       `json:"sparkle_level"` 
	FlavorLevel  int       `json:"flavor_level"`  
	SizeOz       int       `json:"size_oz"`     
	CO2Doses     int       `json:"co2_doses"`
	FlavorDoses  int       `json:"flavor_doses"`
	CreatedAt    time.Time `json:"created_at"`
}
