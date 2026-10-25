#pragma once
// Engine-independent rules. Keep simulation invariants executable without Unreal.
#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <queue>
#include <vector>
namespace Helio
{
constexpr int RoomCount = 4;
enum class Flight { Docked, Cruise, Emergency };
enum class BotState { Idle, Patrol, Repair, Controlled, Destroyed };
struct Atmosphere
{
    float pressure = 1.f;
    float temperature = 21.f;
    bool breach = false;
    bool venting = false;
    void step(float dt)
    {
        dt = std::clamp(dt, 0.f, 1.f);
        pressure = std::clamp(pressure + (breach ? -.065f : .035f) * dt, 0.f, 1.f);
        temperature = std::clamp(temperature + (venting ? 8.f : (21.f - temperature) * .08f) * dt, -80.f, 220.f);
    }
    bool unsafe() const { return pressure < .65f || temperature > 65.f || breach || venting; }
};
inline bool doorLocked(Flight mode, const Atmosphere& a, const Atmosphere& b)
{
    return mode == Flight::Emergency || a.unsafe() || b.unsafe();
}
inline bool airlockLocked(Flight mode) { return mode != Flight::Docked; }
inline std::vector<int> route(int start, int goal, const std::array<bool, 3>& locked)
{
    if (start < 0 || start >= RoomCount || goal < 0 || goal >= RoomCount) return {};
    std::array<int, RoomCount> prev{-1, -1, -1, -1};
    std::queue<int> q; q.push(start); prev[start] = start;
    while (!q.empty())
    {
        const int p = q.front(); q.pop();
        for (int n : {p - 1, p + 1})
        {
            if (n < 0 || n >= RoomCount || prev[n] != -1 || locked[std::min(n, p)]) continue;
            prev[n] = p; q.push(n);
        }
    }
    if (prev[goal] == -1) return {};
    std::vector<int> result;
    for (int n = goal; n != start; n = prev[n]) result.push_back(n);
    result.push_back(start); std::reverse(result.begin(), result.end()); return result;
}
struct Bot
{
    float health = 100.f;
    BotState state = BotState::Patrol;
    void damage(float amount)
    {
        health = std::max(0.f, health - std::max(0.f, amount));
        if (health <= 0.f) state = BotState::Destroyed;
    }
};
// Only uncompressed, 16-bit little-endian mono/stereo WAVs are supported natively.
struct Wave { int channels = 0; int rate = 0; std::vector<uint8_t> pcm; };
inline bool readWave(const std::vector<uint8_t>& data, Wave& out)
{
    out = Wave{};
    if (data.size() < 12) return false;
    auto u16 = [&](size_t i) { return uint32_t(data[i]) | (uint32_t(data[i + 1]) << 8); };
    auto u32 = [&](size_t i) { return u16(i) | (u16(i + 2) << 16); };
    auto tag = [&](size_t i, const char* t) { return std::equal(data.begin() + i, data.begin() + i + 4, t); };
    if (!tag(0, "RIFF") || !tag(8, "WAVE")) return false;
    const uint64_t end = uint64_t(u32(4)) + 8;
    if (end > data.size() || end < 12) return false;
    bool fmt = false;
    for (uint64_t i = 12; i + 8 <= end;)
    {
        const uint32_t size = u32(i + 4);
        const uint64_t payload = i + 8;
        if (payload + size > end) return false;
        if (tag(i, "fmt "))
        {
            if (size < 16 || u16(payload) != 1 || u16(payload + 14) != 16) return false;
            out.channels = u16(payload + 2); out.rate = u32(payload + 4);
            if ((out.channels != 1 && out.channels != 2) || out.rate < 8000 || out.rate > 96000) return false;
            if (u16(payload + 12) != uint32_t(out.channels * 2) || u32(payload + 8) != uint32_t(out.rate * out.channels * 2)) return false;
            fmt = true;
        }
        else if (tag(i, "data")) out.pcm.assign(data.begin() + payload, data.begin() + payload + size);
        i = payload + size + (size & 1);
    }
    return fmt && !out.pcm.empty() && out.pcm.size() % (out.channels * 2) == 0;
}
}
