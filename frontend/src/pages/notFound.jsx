import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <div className="absolute top-4 right-4"></div>
      <div className="hidden">
        <ThemeToggle />
      </div>
      <div className="container flex max-w-md flex-col items-center justify-center gap-6 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
          404
        </h1>
        <h2 className="text-xl font-semibold sm:text-2xl md:text-3xl">
          Page Not Found
        </h2>
        <p className="text-muted-foreground">
          Oops! The page you are looking for doesn't exist or has been moved.
        </p>
        <Button asChild>
          <a href="/">Go Back Home</a>
        </Button>
      </div>
    </div>
  );
}
