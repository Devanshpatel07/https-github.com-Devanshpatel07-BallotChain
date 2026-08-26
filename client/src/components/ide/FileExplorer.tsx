"use client";

import { useState } from "react";
import {
  FolderOpen,
  Folder,
  FileText,
  FileCode2,
  ChevronRight,
  ChevronDown,
  Plus,
  MoreHorizontal,
} from "lucide-react";

interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  language?: string;
}

const fileTree: FileNode[] = [
  {
    name: "contract",
    type: "folder",
    children: [
      {
        name: "src",
        type: "folder",
        children: [
          { name: "lib.rs", type: "file", language: "rust" },
          { name: "test.rs", type: "file", language: "rust" },
          { name: "registry.rs", type: "file", language: "rust" },
        ],
      },
      {
        name: "Cargo.toml",
        type: "file",
        language: "toml",
      },
    ],
  },
  {
    name: "frontend",
    type: "folder",
    children: [
      {
        name: "src",
        type: "folder",
        children: [
          { name: "App.tsx", type: "file", language: "typescript" },
          { name: "main.tsx", type: "file", language: "typescript" },
        ],
      },
      { name: "package.json", type: "file", language: "json" },
    ],
  },
  { name: ".env", type: "file", language: "env" },
  { name: "Cargo.toml", type: "file", language: "toml" },
];

function getFileIcon(name: string) {
  if (name.endsWith(".rs")) return <FileCode2 className="w-4 h-4 text-accent-red" />;
  if (name.endsWith(".tsx") || name.endsWith(".ts"))
    return <FileCode2 className="w-4 h-4 text-cyan" />;
  if (name.endsWith(".toml")) return <FileText className="w-4 h-4 text-accent-amber" />;
  if (name.endsWith(".json")) return <FileText className="w-4 h-4 text-accent-green" />;
  return <FileText className="w-4 h-4 text-text-muted" />;
}

function TreeNode({
  node,
  depth = 0,
  onSelect,
  selectedFile,
}: {
  node: FileNode;
  depth?: number;
  onSelect: (name: string) => void;
  selectedFile: string;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const isFolder = node.type === "folder";

  return (
    <div>
      <button
        onClick={() => {
          if (isFolder) setExpanded(!expanded);
          else onSelect(node.name);
        }}
        className={`w-full flex items-center gap-1.5 py-1 px-2 text-sm rounded-md hover:bg-surface-alt transition-colors group ${
          selectedFile === node.name && !isFolder
            ? "bg-surface-alt text-foreground"
            : "text-text-secondary"
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isFolder ? (
          expanded ? (
            <ChevronDown className="w-3.5 h-3.5 shrink-0 text-text-muted" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-text-muted" />
          )
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        {isFolder ? (
          expanded ? (
            <FolderOpen className="w-4 h-4 text-cyan shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-text-muted shrink-0" />
          )
        ) : (
          getFileIcon(node.name)
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {isFolder && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.name}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
              selectedFile={selectedFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileExplorer({
  selectedFile,
  onSelectFile,
}: {
  selectedFile: string;
  onSelectFile: (f: string) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          Explorer
        </span>
        <button className="p-1 text-text-muted hover:text-foreground hover:bg-surface rounded transition-colors">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {fileTree.map((node) => (
          <TreeNode
            key={node.name}
            node={node}
            onSelect={onSelectFile}
            selectedFile={selectedFile}
          />
        ))}
      </div>
    </div>
  );
}
