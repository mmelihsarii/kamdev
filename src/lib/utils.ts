export function cn(...siniflar: Array<string | false | null | undefined>) {
  return siniflar.filter(Boolean).join(" ");
}
