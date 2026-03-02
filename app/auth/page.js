import AuthPanel from "@/components/auth/AuthPanel";

export const metadata = {
  title: "Login or Register",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthPage() {
  return <AuthPanel />;
}
