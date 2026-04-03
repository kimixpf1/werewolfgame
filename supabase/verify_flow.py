import json
import random
import urllib.request
import urllib.error

BASE_URL = "https://ejeiuqcmkznfbglvbkbe.supabase.co/rest/v1/rpc"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqZWl1cWNta3puZmJnbHZia2JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODU4NzIsImV4cCI6MjA4NzE2MTg3Mn0.NfmTSA9DhuP51XKF0qfTuPINtSc7i26u5yIbl69cdAg"
HEADERS = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json",
}


def rpc(name: str, payload: dict):
    request = urllib.request.Request(
        f"{BASE_URL}/{name}",
        data=json.dumps(payload).encode("utf-8"),
        headers=HEADERS,
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"{name} failed: {error.code} {body}") from error


room_id = str(random.randint(100000, 999999))
host_id = f"host{random.randint(10000, 99999)}"
roles = [
    {"type": "werewolf", "name": "狼人", "count": 1},
    {"type": "seer", "name": "预言家", "count": 1},
]

created = rpc(
    "app_create_room",
    {
        "p_room_id": room_id,
        "p_host_id": host_id,
        "p_host_name": "法官A",
        "p_player_count": 2,
        "p_roles": roles,
        "p_enable_sheriff": True,
        "p_win_mode": "side",
        "p_enable_auto_judge": False,
    },
)

host_token = created["host_token"]
host_player_token = created["player_token"]

snapshot_after_create = rpc(
    "app_get_room_snapshot",
    {
        "p_room_id": room_id,
        "p_player_id": host_id,
        "p_player_token": host_player_token,
    },
)

joined = rpc(
    "app_join_room",
    {
        "p_room_id": room_id,
        "p_player_name": "玩家一",
        "p_existing_player_id": None,
        "p_existing_player_token": None,
    },
)

player_id = joined["player"]["id"]
player_token = joined["player_token"]

disconnect = rpc(
    "app_set_player_connection",
    {
        "p_room_id": room_id,
        "p_player_id": player_id,
        "p_player_token": player_token,
        "p_is_connected": False,
    },
)

rejoined = rpc(
    "app_join_room",
    {
        "p_room_id": room_id,
        "p_player_name": "玩家一",
        "p_existing_player_id": None,
        "p_existing_player_token": None,
    },
)

updated_room = rpc(
    "app_update_room",
    {
        "p_room_id": room_id,
        "p_host_token": host_token,
        "p_patch": {
            "status": "playing",
            "current_round": 2,
            "sheriff_id": player_id,
        },
    },
)

updated_player = rpc(
    "app_update_player",
    {
        "p_room_id": room_id,
        "p_target_player_id": player_id,
        "p_patch": {"is_alive": False},
        "p_host_token": host_token,
        "p_player_id": None,
        "p_player_token": None,
    },
)

restored = rpc(
    "app_restore_player_session",
    {
        "p_room_id": room_id,
        "p_player_id": player_id,
        "p_player_token": rejoined["player_token"],
    },
)

final_snapshot = rpc(
    "app_get_room_snapshot",
    {
        "p_room_id": room_id,
        "p_player_id": host_id,
        "p_player_token": host_player_token,
    },
)

print(
    json.dumps(
        {
            "room_id": room_id,
            "created": created,
            "snapshot_after_create": snapshot_after_create,
            "joined": joined,
            "disconnect": disconnect,
            "rejoined": rejoined,
            "updated_room": updated_room,
            "updated_player": updated_player,
            "restored": restored,
            "final_snapshot": final_snapshot,
        },
        ensure_ascii=False,
        indent=2,
    )
)
