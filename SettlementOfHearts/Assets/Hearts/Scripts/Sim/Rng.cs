using System;

namespace Hearts.Sim
{
    // Deterministic RNG whose whole state is one ulong stored in SettlementState,
    // so a save plus the same player actions always replays identically.
    public class Rng
    {
        readonly SettlementState state;

        public Rng(SettlementState state)
        {
            this.state = state;
            if (state.rngState == 0) state.rngState = 0x9E3779B97F4A7C15UL;
        }

        public static ulong SeedState(int seed)
        {
            ulong s = (ulong)(uint)seed + 0x9E3779B97F4A7C15UL;
            s = Mix(s);
            return s == 0 ? 1UL : s;
        }

        public ulong NextULong()
        {
            // xorshift64*
            ulong x = state.rngState;
            x ^= x >> 12;
            x ^= x << 25;
            x ^= x >> 27;
            state.rngState = x;
            return x * 0x2545F4914F6CDD1DUL;
        }

        // Uniform in [0, 1).
        public double NextDouble()
        {
            return (NextULong() >> 11) * (1.0 / 9007199254740992.0);
        }

        public float Value() { return (float)NextDouble(); }

        public float Range(float min, float max) { return min + (max - min) * Value(); }

        public int Range(int minInclusive, int maxExclusive)
        {
            if (maxExclusive <= minInclusive) return minInclusive;
            return minInclusive + (int)(NextDouble() * (maxExclusive - minInclusive));
        }

        public bool Chance(double p) { return NextDouble() < p; }

        public float Gaussian(float mean, float stdDev)
        {
            double u1 = 1.0 - NextDouble();
            double u2 = NextDouble();
            double n = Math.Sqrt(-2.0 * Math.Log(u1)) * Math.Cos(2.0 * Math.PI * u2);
            return mean + stdDev * (float)n;
        }

        // Stateless hash for values that must be fixed per pair (for example Spark).
        public static double Hash01(int a, int b, int salt)
        {
            int lo = Math.Min(a, b), hi = Math.Max(a, b);
            ulong h = Mix((ulong)(uint)lo * 0x100000001B3UL ^ (ulong)(uint)hi << 21 ^ (ulong)(uint)salt << 42);
            return (h >> 11) * (1.0 / 9007199254740992.0);
        }

        static ulong Mix(ulong z)
        {
            // splitmix64 finaliser
            z = (z ^ (z >> 30)) * 0xBF58476D1CE4E5B9UL;
            z = (z ^ (z >> 27)) * 0x94D049BB133111EBUL;
            return z ^ (z >> 31);
        }
    }
}
