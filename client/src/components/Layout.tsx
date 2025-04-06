import { ReactNode } from "react";
import ThemeToggle from "./ThemeToggle";
import { Database } from "lucide-react";
import { Link } from "wouter";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <Database className="h-6 w-6 text-primary mr-2" />
              <h1 className="text-xl font-bold text-foreground">DataCleanse</h1>
            </div>
          </Link>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <a 
              href="https://github.com/yourusername/datacleanse" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              Documentation
            </a>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Database className="h-6 w-6 text-primary mr-2" />
              <span className="text-lg font-bold text-foreground">DataCleanse</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              <a href="#" className="text-muted-foreground hover:text-foreground">Documentation</a>
              <a href="#" className="text-muted-foreground hover:text-foreground">API</a>
              <a href="#" className="text-muted-foreground hover:text-foreground">Support</a>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm mb-4 md:mb-0">© {new Date().getFullYear()} DataCleanse. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
