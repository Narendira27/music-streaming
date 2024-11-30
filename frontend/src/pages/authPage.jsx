import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_URL } from "@/lib/url";

import { toast } from "sonner";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [registerInfo, setRegisterInfo] = useState({
    email: "",
    name: "",
    password: "",
  });
  const [loginInfo, setLoginInfo] = useState({ email: "", password: "" });
  const [errorInfo, setErrorInfo] = useState({
    errorStatus: false,
    errorInfo: "",
    showResendBtn: false,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const token = Cookies.get("auth-cookie");
    if (token) {
      axios
        .get(API_URL + "/user/me", {
          headers: { Authorization: "Bearer " + token },
        })
        .then(() => {
          navigate("/dashboard");
        });
    }
  }, []);

  const onClickRegister = async () => {
    const response = axios.post(API_URL + "/auth/register", {
      email: registerInfo.email,
      password: registerInfo.password,
      name: registerInfo.name,
    });
    toast.promise(response, {
      loading: "Sending Request ....",
      success: () => {
        setRegisterInfo({ name: "", email: "", password: "" });
        const returnMsg = `Registration Success, Verify Your Email and Login`;
        return returnMsg;
      },
      error: (res) => {
        setRegisterInfo({ name: "", email: "", password: "" });
        return "Error : " + res.response.data.msg;
      },
    });
  };
  const onClickResendEmail = (email) => {
    const response = axios.post(API_URL + "/auth/resend?email=" + email);
    toast.promise(response, {
      loading: "Resending Email ....",
      success: () => {
        return `Email Sent`;
      },
      error: (res) => {
        return "Error : " + res.response.data.msg;
      },
    });
  };
  const onClickLogin = () => {
    const response = axios.post(API_URL + "/auth/login", {
      email: loginInfo.email,
      password: loginInfo.password,
    });
    toast.promise(response, {
      loading: "Sending Request ....",
      success: (res) => {
        const token = res.data.token;
        Cookies.set("auth-cookie", token);
        navigate("/dashboard");
        setLoginInfo({ email: "", password: "" });
        const returnMsg = `Login Successful`;
        return returnMsg;
      },
      error: (res) => {
        if (res) {
          if (res.response.data.msg === "Email not verified") {
            toast("Email not verified", {
              action: {
                label: "Resend Email",
                onClick: () => onClickResendEmail(loginInfo.email),
              },
            });
          }
        }
        setLoginInfo({ email: "", password: "" });
        return "Error : " + res.response.data.msg;
      },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              Welcome to Notify
            </CardTitle>
            <ThemeToggle />
          </div>
          <CardDescription>
            Sign in to continue or create a new account to start building your
            personalized playlists. Dive into seamless music streaming with just
            a few clicks!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={loginInfo.email}
                    placeholder="m@example.com"
                    onChange={(e) => {
                      setLoginInfo((each) => ({
                        ...each,
                        email: e.target.value,
                      }));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={loginInfo.password}
                    onChange={(e) => {
                      setLoginInfo((each) => ({
                        ...each,
                        password: e.target.value,
                      }));
                    }}
                  />
                </div>
                <Button onClick={onClickLogin} className="w-full">
                  Login
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="signup">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={registerInfo.name}
                    onChange={(e) => {
                      setRegisterInfo((each) => ({
                        ...each,
                        name: e.target.value,
                      }));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    onChange={(e) => {
                      setRegisterInfo((each) => ({
                        ...each,
                        email: e.target.value,
                      }));
                    }}
                    placeholder="m@example.com"
                    value={registerInfo.email}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    onChange={(e) => {
                      setRegisterInfo((each) => ({
                        ...each,
                        password: e.target.value,
                      }));
                    }}
                    id="password"
                    type="password"
                    value={registerInfo.password}
                  />
                </div>
                <Button onClick={onClickRegister} className="w-full">
                  Sign Up
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            By clicking submit, you agree to our Terms of Service and Privacy
            Policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
