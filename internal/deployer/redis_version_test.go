package deployer

import "testing"

func TestCheckRedisVersion(t *testing.T) {
	out := "Redis server v=7.0.15 sha=00000000:0 malloc=libc bits=64 build=abc\n"
	cases := []struct {
		want string
		ok   bool
	}{
		{"7", true},
		{"7.0", true},
		{"7.0.15", true},
		{"7.2", false},
		{"6", false},
	}
	for _, tc := range cases {
		err := checkRedisVersion(out, tc.want)
		if (err == nil) != tc.ok {
			t.Errorf("checkRedisVersion(%q) err=%v, want ok=%v", tc.want, err, tc.ok)
		}
	}
	if err := checkRedisVersion("garbage", "7"); err == nil {
		t.Errorf("unreadable version output must be rejected")
	}
}
