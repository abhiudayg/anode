package deployer

import (
	"reflect"
	"testing"
)

func TestParseReleaseIDsNewestFirstAndSkipsJunk(t *testing.T) {
	got := parseReleaseIDs("1794000001\nnot-a-release\n1794000003\n1794000002\n")
	want := []string{"1794000003", "1794000002", "1794000001"}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("got %v, want %v", got, want)
	}
}

func TestReleasesToRemoveKeepsNewest(t *testing.T) {
	got := releasesToRemove([]string{"5", "4", "3", "2", "1"}, 3)
	if !reflect.DeepEqual(got, []string{"2", "1"}) {
		t.Errorf("got %v, want [2 1]", got)
	}
	if releasesToRemove([]string{"2", "1"}, 3) != nil {
		t.Errorf("nothing should be removed when fewer than kept")
	}
}

func TestUnitsToRemoveOnlyTouchesAnodeUnitsNotKept(t *testing.T) {
	units := []string{"anode-orders.service", "anode-old.service", "sshd.service", "anode-redis-db.service"}
	keep := map[string]bool{"anode-orders.service": true, "anode-redis-db.service": true}
	got := unitsToRemove(units, keep)
	if !reflect.DeepEqual(got, []string{"anode-old.service"}) {
		t.Errorf("got %v, want [anode-old.service]", got)
	}
}
