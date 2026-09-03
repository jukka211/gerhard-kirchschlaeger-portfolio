import type { Metadata } from "next";
import GridToolLoader from "./GridToolLoader";

export const metadata: Metadata = {
  title: "Grid Tool",
  description: "Generate a gap-free media grid and export it as an MP4 clip.",
};

export default function GridToolPage() {
  return <GridToolLoader />;
}
