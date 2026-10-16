type ColorPair = {
  dark: string;
  light: string;
};

export default function generateColorPair(): ColorPair {
  const hue = Math.floor(Math.random() * 360);

  // Vary saturation and lightness to create more visual diversity.
  const darkSaturation = randomBetween(55, 90);
  const darkLightness = randomBetween(25, 40);

  const lightSaturation = randomBetween(60, 95);
  const lightLightness = randomBetween(40, 55);

  const dark = hslToHex(hue, darkSaturation, darkLightness);
  const light = hslToHex(hue, lightSaturation, lightLightness);

  return { dark, light };
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);

  const f = (n: number) =>
    Math.round(
      255 *
        (l -
          a *
            Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)))
    );

  return (
    "#" +
    [f(0), f(8), f(4)]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}