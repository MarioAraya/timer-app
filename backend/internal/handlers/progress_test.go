package handlers

import (
	"testing"
	"time"

	"timer-app/backend/internal/models"
)

func day(offset int) *time.Time {
	t := time.Now().UTC().AddDate(0, 0, offset)
	return &t
}

func TestComputeStatsEmpty(t *testing.T) {
	stats := computeStats(nil)
	if stats.TotalSessions != 0 || stats.CompletedSessions != 0 || stats.CurrentStreak != 0 {
		t.Fatalf("stats = %+v, want all zero", stats)
	}
	if stats.SessionsByType == nil {
		t.Fatal("SessionsByType should be initialized, got nil")
	}
}

func TestComputeStatsCounts(t *testing.T) {
	today := day(0)
	entries := []models.ProgressEntry{
		{RoutineType: "hiit", ActiveSeconds: 100, Completed: true, SessionDate: today},
		{RoutineType: "hiit", ActiveSeconds: 50, Completed: false, SessionDate: day(-1)},
		{RoutineType: "tabata", ActiveSeconds: 200, Completed: true, SessionDate: day(-1)},
	}
	stats := computeStats(entries)

	if stats.TotalSessions != 3 {
		t.Errorf("TotalSessions = %d, want 3", stats.TotalSessions)
	}
	if stats.CompletedSessions != 2 {
		t.Errorf("CompletedSessions = %d, want 2", stats.CompletedSessions)
	}
	if stats.TotalActiveSeconds != 350 {
		t.Errorf("TotalActiveSeconds = %d, want 350", stats.TotalActiveSeconds)
	}
	if stats.SessionsByType["hiit"] != 2 || stats.SessionsByType["tabata"] != 1 {
		t.Errorf("SessionsByType = %v, want hiit=2 tabata=1", stats.SessionsByType)
	}
	if stats.LastSessionDate == nil || !stats.LastSessionDate.Equal(*today) {
		t.Errorf("LastSessionDate = %v, want %v", stats.LastSessionDate, today)
	}
}

func TestCalculateStreaksEmpty(t *testing.T) {
	current, longest := calculateStreaks(map[string]bool{})
	if current != 0 || longest != 0 {
		t.Fatalf("streaks = (%d, %d), want (0, 0)", current, longest)
	}
}

func TestCalculateStreaksConsecutiveEndingToday(t *testing.T) {
	dates := map[string]bool{
		day(0).Format("2006-01-02"):  true,
		day(-1).Format("2006-01-02"): true,
		day(-2).Format("2006-01-02"): true,
	}
	current, longest := calculateStreaks(dates)
	if current != 3 {
		t.Errorf("current = %d, want 3", current)
	}
	if longest != 3 {
		t.Errorf("longest = %d, want 3", longest)
	}
}

func TestCalculateStreaksBrokenStreakNotEndingToday(t *testing.T) {
	// racha de 3 días hace una semana, no cuenta como racha actual
	dates := map[string]bool{
		day(-10).Format("2006-01-02"): true,
		day(-9).Format("2006-01-02"):  true,
		day(-8).Format("2006-01-02"):  true,
	}
	current, longest := calculateStreaks(dates)
	if current != 0 {
		t.Errorf("current = %d, want 0 (streak doesn't reach today/yesterday)", current)
	}
	if longest != 3 {
		t.Errorf("longest = %d, want 3", longest)
	}
}

func TestCalculateStreaksEndingYesterdayStillCounts(t *testing.T) {
	dates := map[string]bool{
		day(-1).Format("2006-01-02"): true,
		day(-2).Format("2006-01-02"): true,
	}
	current, _ := calculateStreaks(dates)
	if current != 2 {
		t.Errorf("current = %d, want 2 (ended yesterday still counts)", current)
	}
}

func TestCalculateStreaksLongestNotCurrent(t *testing.T) {
	dates := map[string]bool{
		day(-20).Format("2006-01-02"): true,
		day(-19).Format("2006-01-02"): true,
		day(-18).Format("2006-01-02"): true,
		day(-17).Format("2006-01-02"): true,
		day(0).Format("2006-01-02"):   true,
	}
	current, longest := calculateStreaks(dates)
	if current != 1 {
		t.Errorf("current = %d, want 1", current)
	}
	if longest != 4 {
		t.Errorf("longest = %d, want 4", longest)
	}
}
