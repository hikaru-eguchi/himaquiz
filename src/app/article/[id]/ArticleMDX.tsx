"use client";

import { MDXRemote } from "next-mdx-remote";
import HintAnswer from "@/app/components/HintAnswer";

interface ArticleMDXProps {
  mdxSource: any;
}

export default function ArticleMDX({ mdxSource }: ArticleMDXProps) {
  return <MDXRemote {...mdxSource} components={{ HintAnswer }} />;
}
