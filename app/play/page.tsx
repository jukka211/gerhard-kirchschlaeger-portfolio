export default function PlayPage() {
  return (
    <main
      style={{
        width: "100vw",
        height: "100dvh",
        margin: 0,
        padding: 0,
        overflow: "hidden",
      }}
    >
      <iframe
        src="/play-static/index.html"
        title="Play"
        style={{
          width: "100%",
          height: "100%",
          border: 0,
          display: "block",
        }}
      />
    </main>
  );
}