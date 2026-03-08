package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Email     string         `gorm:"uniqueIndex;not null" json:"email"`
	Password  string         `gorm:"not null" json:"-"`
	IsAdmin   bool           `gorm:"default:false" json:"isAdmin"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type ThemeColors struct {
	ID                   uint   `gorm:"primaryKey" json:"id"`
	UserID               uint   `gorm:"uniqueIndex;not null" json:"userId"`
	Primary              string `json:"primary"`
	OnPrimary            string `json:"onPrimary"`
	PrimaryContainer     string `json:"primaryContainer"`
	OnPrimaryContainer   string `json:"onPrimaryContainer"`
	Secondary            string `json:"secondary"`
	OnSecondary          string `json:"onSecondary"`
	SecondaryContainer   string `json:"secondaryContainer"`
	OnSecondaryContainer string `json:"onSecondaryContainer"`
	Tertiary             string `json:"tertiary"`
	OnTertiary           string `json:"onTertiary"`
	TertiaryContainer    string `json:"tertiaryContainer"`
	OnTertiaryContainer  string `json:"onTertiaryContainer"`
	Surface              string `json:"surface"`
	OnSurface            string `json:"onSurface"`
	SurfaceVariant       string `json:"surfaceVariant"`
	OnSurfaceVariant     string `json:"onSurfaceVariant"`
	Background           string `json:"background"`
	OnBackground         string `json:"onBackground"`
	Error                string `json:"error"`
	OnError              string `json:"onError"`
	Outline              string `json:"outline"`
	CreatedAt            time.Time
	UpdatedAt            time.Time
}
