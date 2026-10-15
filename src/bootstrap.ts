// The original campaign and its save namespace remain available unchanged.
if (new URLSearchParams(location.search).get("mode") === "classic") {
  void import("./main");
} else {
  void import("./streets/main");
}
