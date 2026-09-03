"use client";

import dynamic from "next/dynamic";

const GridTool = dynamic(() => import("./GridTool"), { ssr: false });

export default function GridToolLoader() {
  return <GridTool />;
}
