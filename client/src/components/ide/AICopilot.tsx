"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Copy,
  Check,
  Wand2,
  Bug,
  MessageSquare,
  Lightbulb,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const sorobanKnowledge: Record<string, (query: string) => string> = {
  "generate a vote method": (_q) =>
    `Your contract already has a \`vote\` method. Here's how it works:

\`\`\`rust
pub fn vote(env: Env, voter: Address, candidate: String) {
    voter.require_auth();
    // ... checks and state updates
}
\`\`\`

It uses \`require_auth()\` to verify the voter, checks for double-voting via the \`Voters\` map, validates the candidate exists, and increments the vote count. Want me to add features like time-limited voting or vote delegation?`,

  "debug my contract": (_q) =>
    `Let me check your contract for common issues:

**Common Soroban pitfalls to check:**
1. **Map keys must be owned** — use \`map.get(key.clone())\` not \`map.get(&key)\`
2. **Vec uses \`push_back()\`** not \`.push()\`
3. **String::from_str(&env, "x")** not \`String::from("x")\`
4. **Storage uses \`&\` refs** — \`env.storage().instance().set(&key, &val)\`

Your current \`lib.rs\` looks correct — all Map operations use owned values, Vec uses \`push_back\`, and storage uses references. The contract should compile cleanly.`,

  "explain this code": (q) =>
    `Let me explain the Soroban patterns in your contract:

**Storage Pattern:** Your contract uses \`env.storage().instance()\` for shared state with a common TTL. The \`DataKey\` enum acts as a type-safe storage key namespace.

**Auth Pattern:** \`require_auth()\` is called at the start of state-changing functions. This ensures only the authorized signer can execute the operation.

**Map Pattern:** Maps are used for both \`Votes\` (String \u2192 u32) and \`Voters\` (Address \u2192 bool). The \`unwrap_or()\` pattern safely handles missing keys with defaults.

Want me to explain any specific part in more detail?`,

  "add auth to my contract": (_q) =>
    `Your contract already has auth! Here's a breakdown:

\`\`\`rust
// Owner-only function
pub fn add_candidate(env: Env, caller: Address, candidate: String) {
    caller.require_auth();
    let owner: Address = env.storage().instance().get(&DataKey::Owner).unwrap();
    assert!(caller == owner, "only owner can add candidates");
    // ...
}

// Public function with auth
pub fn vote(env: Env, voter: Address, candidate: String) {
    voter.require_auth();
    // ...
}
\`\`\`

\`require_auth()\` ensures the caller signed the transaction. For additional patterns like multi-sig or role-based access, let me know!`,
};

const defaultResponse = (query: string) =>
  `Great question! Based on your **Voting Contract** project:

\`\`\`rust
// Current contract structure:
DataKey::Owner      // Address — contract admin
DataKey::Votes      // Map<String, u32> — vote counts
DataKey::Voters     // Map<Address, bool> — who voted
DataKey::Candidates // Vec<String> — candidate list
\`\`\`

I can help with:
- **Adding new methods** to your contract
- **Explaining** Soroban SDK patterns
- **Debugging** compilation errors
- **Creating** React frontend components

Try asking something specific about your code, or click a suggested prompt below!`;

const suggestedPrompts = [
  { icon: Wand2, label: "Generate a vote method", color: "text-cyan" },
  { icon: Bug, label: "Debug my contract", color: "text-accent-red" },
  { icon: Lightbulb, label: "Explain this code", color: "text-accent-amber" },
  { icon: MessageSquare, label: "Add auth to my contract", color: "text-purple" },
];

export default function AICopilot({
  activeFile,
  contractId,
  initialPrompt,
  onPromptSent,
}: {
  activeFile?: string;
  contractId?: string | null;
  initialPrompt?: string;
  onPromptSent?: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hi! I'm your Stellar Soroban AI Copilot. I can help you:\n\n- **Generate** contract methods and Rust code\n- **Debug** compilation and runtime errors\n- **Explain** Soroban SDK patterns\n- **Create** React frontend components\n\nWhat would you like help with?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hasSentInitial, setHasSentInitial] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-send initial prompt from Hero landing page
  useEffect(() => {
    if (initialPrompt && !hasSentInitial) {
      setHasSentInitial(true);
      onPromptSent?.();
      setTimeout(() => handleSend(initialPrompt), 300);
    }
  }, [initialPrompt]);

  const findResponse = (query: string): string => {
    const lower = query.toLowerCase();
    for (const [key, fn] of Object.entries(sorobanKnowledge)) {
      if (lower.includes(key)) {
        return fn(query);
      }
    }
    return defaultResponse(query);
  };

  const handleSend = (text?: string) => {
    const content = text || input;
    if (!content.trim()) return;

    const contextHint = contractId
      ? `\n\n_[Context: editing ${activeFile || "lib.rs"}, contract ${contractId.slice(0, 12)}...]_`
      : activeFile && activeFile !== "lib.rs"
        ? `\n\n_[Context: editing ${activeFile}]_`
        : "";

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content + contextHint,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response with contextual delay
    setTimeout(() => {
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: findResponse(content),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 1000 + Math.random() * 800);
  };

  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-cyan to-purple flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-background" />
          </div>
          <span className="text-xs font-medium text-text-secondary">
            AI Copilot
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {contractId && (
            <span className="text-[10px] text-accent-green px-1.5 py-0.5 rounded bg-accent-green/10">
              Linked
            </span>
          )}
          <span className="text-[10px] text-text-muted px-1.5 py-0.5 rounded bg-surface">
            Soroban Expert
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="group"
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                    msg.role === "assistant"
                      ? "bg-gradient-to-br from-cyan/20 to-purple/20 border border-cyan/20"
                      : "bg-surface border border-border"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Bot className="w-3 h-3 text-cyan" />
                  ) : (
                    <User className="w-3 h-3 text-text-secondary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-text-muted mb-1">
                    {msg.role === "assistant" ? "Copilot" : "You"} &middot;{" "}
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap break-words">
                    {renderMarkdown(msg.content)}
                  </div>
                  {msg.role === "assistant" && (
                    <button
                      onClick={() => copyMessage(msg.id, msg.content)}
                      className="mt-1.5 p-1 rounded text-text-muted hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-accent-green" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-text-muted text-xs"
          >
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            Copilot is thinking...
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts */}
      {messages.length <= 1 && (
        <div className="px-3 pb-2">
          <div className="grid grid-cols-2 gap-1.5">
            {suggestedPrompts.map((p) => (
              <button
                key={p.label}
                onClick={() => handleSend(p.label)}
                className="flex items-center gap-1.5 px-2.5 py-2 text-xs text-text-secondary rounded-lg border border-border hover:border-cyan/20 hover:bg-surface transition-all text-left"
              >
                <p.icon className={`w-3 h-3 shrink-0 ${p.color}`} />
                <span className="truncate">{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-3 pb-3">
        <div className="flex items-center gap-2 bg-surface rounded-xl border border-border px-3 py-2 focus-within:border-cyan/30 transition-colors">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about Soroban..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-text-muted outline-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="p-1.5 rounded-lg bg-cyan text-background hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function renderMarkdown(text: string): React.ReactNode {
  // Simple markdown rendering for code blocks and bold
  const parts = text.split(/(```[\s\S]*?```|`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      const lines = part.slice(3, -3);
      const firstNewline = lines.indexOf("\n");
      const lang = firstNewline > 0 ? lines.slice(0, firstNewline).trim() : "";
      const code = firstNewline > 0 ? lines.slice(firstNewline + 1) : lines;
      return (
        <pre
          key={i}
          className="bg-surface border border-border rounded-lg p-3 my-2 overflow-x-auto"
        >
          {lang && (
            <div className="text-[10px] text-text-muted mb-1 font-mono uppercase">
              {lang}
            </div>
          )}
          <code className="text-xs font-mono text-cyan/90 leading-relaxed">
            {code}
          </code>
        </pre>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 bg-surface border border-border rounded text-xs font-mono text-cyan"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
