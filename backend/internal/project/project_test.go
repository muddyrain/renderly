package project

import (
	"strings"
	"testing"
)

func TestUnicodeValidation(t *testing.T) {
	for _, tc := range []struct {
		name, description string
		valid             bool
	}{{" 中文 😀 ", " 第一行\n第二行 ", true}, {strings.Repeat("😀", 120), strings.Repeat("汉", 1000), true}, {strings.Repeat("😀", 121), "", false}, {"项目", strings.Repeat("😀", 1001), false}, {"\u0085\t ", "", false}, {"\x00", "", false}, {"有效", "\x00", false}} {
		name, description, err := ValidateText(tc.name, tc.description)
		if (err == nil) != tc.valid {
			t.Fatalf("validation valid=%t got %v", tc.valid, err)
		}
		if err == nil && (strings.TrimSpace(name) != name || strings.TrimSpace(description) != description) {
			t.Fatal("text not normalized")
		}
	}
	for _, id := range []string{"", "bad", "11111111-1111-4111-8111-11111111111g"} {
		if ValidID(id) {
			t.Fatal("invalid ID accepted")
		}
	}
	if !ValidID("11111111-1111-4111-8111-111111111111") {
		t.Fatal("UUID rejected")
	}
}
