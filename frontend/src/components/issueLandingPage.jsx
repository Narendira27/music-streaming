import { Clock, ServerCrash } from "lucide-react";
import { Button } from "./ui/button";

const IssueLandingPage = () => {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-black text-white p-4">
      <div className="max-w-md mx-auto text-center space-y-8">
        <div className="rounded-full bg-red-500/10 p-4 mx-auto w-fit">
          <ServerCrash className="h-16 w-16 text-red-500" />
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">
            Our Servers Are Taking a Break
          </h1>

          <p className="text-gray-400 text-lg">
            We're experiencing some technical difficulties. Our team is working
            hard to get everything back up and running.
          </p>
        </div>
      </div>
    </div>
  );
};
export default IssueLandingPage;
