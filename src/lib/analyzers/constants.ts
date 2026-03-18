// Polite words/phrases for AI treatment scoring
export const POLITE_WORDS = [
  "please", "thank you", "thanks", "could you", "would you",
  "would you mind", "appreciate", "kindly", "if you could",
  "when you get a chance", "no rush", "whenever you can",
  "sorry to bother", "if it's not too much trouble",
  "i'd appreciate", "that would be great", "if possible",
  "do you mind", "can you please", "would it be possible",
  "i was wondering if", "may i ask", "pardon", "excuse me",
  "if you don't mind", "at your convenience", "much appreciated",
  "many thanks", "grateful", "you're the best", "you rock",
  "love it", "brilliant", "that's helpful", "really appreciate",
]

// Gratitude words (after assistant responses)
export const GRATITUDE_WORDS = [
  "thanks", "thank you", "perfect", "great", "awesome",
  "nice", "excellent", "wonderful", "amazing", "good job",
  "well done", "cheers", "brilliant", "fantastic", "superb",
  "exactly what i needed", "that's it", "nailed it", "spot on",
  "works perfectly", "love it", "beautiful", "gorgeous",
  "that's perfect", "you're a legend", "lifesaver", "hero",
  "exactly right", "much better", "this is great",
  "incredible", "you rock", "nice work", "good stuff",
  "that did it", "works great", "solid", "clean",
  "that's exactly what i wanted", "chef's kiss", "10/10",
  "appreciate it", "this is perfect", "just what i needed",
]

// Frustration and profanity indicators
export const FRUSTRATION_WORDS = [
  // Mild frustration
  "ugh", "argh", "ffs", "smh", "sigh", "come on",
  "seriously", "not again", "still broken", "still not working",
  "that's not right", "that's wrong", "nope", "no no no",
  "what the hell", "what the heck",
  // Profanity
  "fuck", "fucking", "fucked", "fucks", "fucker",
  "shit", "shitty", "bullshit", "horseshit",
  "damn", "dammit", "goddamn", "goddammit",
  "ass", "asshole", "dumbass", "jackass", "badass",
  "crap", "crappy",
  "hell", "bloody hell",
  "wtf", "wth", "omfg", "stfu", "lmfao",
  "jfc", "fml", "smfh",
  // Insults directed at code/AI
  "stupid", "dumb", "idiot", "idiotic", "moronic",
  "useless", "worthless", "garbage", "trash", "junk",
  "terrible", "horrible", "awful", "atrocious", "abysmal",
  "pathetic", "ridiculous", "absurd", "insane",
  "braindead", "brain dead", "brain-dead",
  // Aggressive phrases
  "are you kidding", "you've got to be kidding",
  "this is ridiculous", "this sucks", "that sucks",
  "this is garbage", "this is trash", "this is crap",
  "i hate this", "i'm done", "i give up", "forget it",
  "screw it", "screw this", "for crying out loud",
  "what a mess", "what a disaster", "epic fail",
  "how hard can it be", "why is this so hard",
  "just do what i said", "i already told you",
  "read the error", "read what i said",
  "that's not what i asked", "that's not what i said",
  "you're not listening", "pay attention",
  "can you not", "stop doing that", "stop it",
  "enough", "knock it off",
]

// Demanding/commanding phrases (negative treatment indicators)
export const DEMANDING_PHRASES = [
  "just do it", "do it now", "hurry up", "faster",
  "stop wasting time", "get to the point", "skip the explanation",
  "don't explain", "shut up and code", "less talking more coding",
  "i don't care why", "i don't care how", "just make it work",
  "figure it out", "deal with it", "handle it",
  "i didn't ask for an explanation", "too long didn't read",
  "tldr", "tl;dr", "skip", "next", "move on",
  "stop overthinking", "stop over-explaining",
]

// Encouraging/positive interaction phrases
export const ENCOURAGEMENT_WORDS = [
  "good thinking", "smart approach", "clever", "creative",
  "that makes sense", "good point", "fair point",
  "interesting approach", "i like that", "nice catch",
  "good call", "great suggestion", "helpful",
  "that's a good idea", "hadn't thought of that",
  "you're right", "good observation", "nice one",
  "keep going", "continue", "go on", "tell me more",
  "elaborate", "interesting", "impressive",
]

// Common acronyms to exclude from ALL-CAPS detection
export const COMMON_ACRONYMS = [
  "API", "URL", "CSS", "HTML", "JSON", "SQL", "HTTP", "HTTPS", "REST", "JWT",
  "CLI", "IDE", "SDK", "CDN", "DNS", "SSH", "EOF", "ENV", "NPM", "AWS", "GCP",
  "CORS", "CRUD", "DOM", "FTP", "GPU", "CPU", "RAM", "SSD", "TCP", "UDP",
  "XML", "YAML", "TODO", "FIXME", "NOTE", "HACK",
]

// Debug/fix related keywords
export const DEBUG_KEYWORDS = [
  "debug", "fix", "bug", "error", "issue", "broken", "crash", "fail",
  "exception", "stack trace", "traceback", "undefined", "null", "NaN",
  "404", "500", "timeout", "memory leak",
]

// Scaffolding/boilerplate keywords
export const SCAFFOLD_KEYWORDS = [
  "scaffold", "boilerplate", "template", "generate", "create", "init",
  "setup", "starter", "skeleton", "bootstrap", "new project", "new file",
  "new component",
]

// Documentation keywords
export const DOC_KEYWORDS = [
  "document", "documentation", "readme", "comment", "docstring", "jsdoc",
  "tsdoc", "explain", "describe", "annotate", "docs",
]

// Question words
export const QUESTION_STARTERS = [
  "what", "why", "how", "when", "where", "which", "who", "can", "could",
  "would", "should", "is", "are", "do", "does", "will",
]

// Command/imperative verbs
export const IMPERATIVE_VERBS = [
  "fix", "add", "create", "update", "change", "remove", "delete", "move",
  "rename", "refactor", "implement", "build", "write", "make", "set",
  "configure", "install", "run", "deploy", "test", "debug", "optimize",
]

// Mind-change indicators
export const MIND_CHANGE_WORDS = [
  "actually", "wait", "no,", "no ", "never mind", "nevermind", "instead",
  "scratch that", "forget that", "on second thought", "changed my mind",
]

// Stopwords to exclude from word frequency analysis
export const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "can", "may", "might", "shall", "it", "its", "this",
  "that", "these", "those", "i", "you", "he", "she", "we", "they", "me",
  "him", "her", "us", "them", "my", "your", "his", "our", "their", "not",
  "no", "so", "if", "then", "than", "too", "very", "just", "about", "up",
  "out", "into", "over", "after", "before", "between", "under", "again",
  "also", "here", "there", "when", "where", "how", "what", "which", "who",
  "whom", "why", "all", "each", "every", "both", "few", "more", "most",
  "some", "any", "other", "new",
])

export const FILE_TOOL_NAMES = ["Read", "Edit", "Write", "Glob", "Grep"]

export const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  ".ts": "TypeScript", ".tsx": "TypeScript", ".js": "JavaScript", ".jsx": "JavaScript",
  ".py": "Python", ".rb": "Ruby", ".rs": "Rust", ".go": "Go", ".java": "Java",
  ".kt": "Kotlin", ".swift": "Swift", ".cs": "C#", ".cpp": "C++", ".c": "C",
  ".php": "PHP", ".html": "HTML", ".css": "CSS", ".scss": "SCSS",
  ".json": "JSON", ".yaml": "YAML", ".yml": "YAML", ".md": "Markdown",
  ".sql": "SQL", ".sh": "Shell", ".bash": "Shell", ".zsh": "Shell",
  ".vue": "Vue", ".svelte": "Svelte", ".dart": "Dart", ".ex": "Elixir",
}

export const TASK_TYPE_KEYWORDS: Record<string, string[]> = {
  "Debugging": ["debug", "fix", "bug", "error", "issue", "broken", "crash", "fail", "exception"],
  "Building": ["create", "add", "build", "implement", "new", "feature", "scaffold", "generate"],
  "Refactoring": ["refactor", "clean", "reorganize", "restructure", "rename", "move", "extract", "simplify"],
  "Testing": ["test", "spec", "assert", "expect", "mock", "coverage", "jest", "vitest"],
}

// Frameworks and libraries by category — for code impact detection
export const FRAMEWORK_CATEGORIES: Record<string, Record<string, string[]>> = {
  "Frontend": {
    "React": ["react", "jsx", "tsx", "usestate", "useeffect", "useref"],
    "Next.js": ["nextjs", "next.js", "next/", "app router", "getserversideprops"],
    "Vue": ["vue", "vuex", "pinia", "nuxt"],
    "Angular": ["angular", "@angular", "ngmodule"],
    "Svelte": ["svelte", "sveltekit"],
    "Tailwind": ["tailwind", "tailwindcss"],
    "Framer Motion": ["framer-motion", "framer motion", "motion/react"],
    "shadcn": ["shadcn", "radix"],
  },
  "Backend": {
    "Express": ["express", "express.js"],
    "FastAPI": ["fastapi", "fast api"],
    "Django": ["django"],
    "Flask": ["flask"],
    "Rails": ["rails", "ruby on rails"],
    "Spring": ["spring", "springboot"],
    "NestJS": ["nestjs", "nest.js"],
    "Node.js": ["nodejs", "node.js"],
    "Deno": ["deno"],
    "Bun": ["bun"],
  },
  "Database": {
    "PostgreSQL": ["postgres", "postgresql", "pg_"],
    "MongoDB": ["mongodb", "mongoose", "mongo"],
    "MySQL": ["mysql"],
    "Redis": ["redis"],
    "Prisma": ["prisma"],
    "Supabase": ["supabase"],
    "Firebase": ["firebase", "firestore"],
    "SQLite": ["sqlite"],
  },
  "DevOps": {
    "Docker": ["docker", "dockerfile", "docker-compose"],
    "Kubernetes": ["kubernetes", "k8s", "kubectl"],
    "Terraform": ["terraform", "hcl"],
    "AWS": ["aws", "s3", "lambda", "ec2", "cloudfront"],
    "GCP": ["gcp", "google cloud"],
    "Vercel": ["vercel"],
    "GitHub Actions": ["github actions", ".github/workflows"],
  },
  "Testing": {
    "Jest": ["jest"],
    "Vitest": ["vitest"],
    "Pytest": ["pytest"],
    "Playwright": ["playwright"],
    "Cypress": ["cypress"],
  },
  "Other": {
    "GraphQL": ["graphql", "gql"],
    "tRPC": ["trpc"],
    "Stripe": ["stripe"],
    "Auth0": ["auth0"],
    "Clerk": ["clerk"],
    "Zod": ["zod"],
  },
}

// Common tech names for stack loyalty detection
export const TECH_NAMES = [
  "react", "vue", "angular", "svelte", "next", "nextjs", "nuxt", "gatsby",
  "python", "javascript", "typescript", "rust", "go", "golang", "java",
  "kotlin", "swift", "ruby", "php", "perl", "scala", "elixir", "clojure",
  "haskell", "c++", "c#", "csharp", "dart", "flutter", "django", "flask",
  "fastapi", "express", "nestjs", "rails", "laravel", "spring", "node",
  "nodejs", "deno", "bun", "tailwind", "css", "sass", "less", "webpack",
  "vite", "rollup", "docker", "kubernetes", "k8s", "terraform", "aws",
  "gcp", "azure", "firebase", "supabase", "prisma", "mongodb", "postgres",
  "postgresql", "mysql", "redis", "graphql", "rest", "trpc",
]
