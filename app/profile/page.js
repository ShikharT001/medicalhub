import ProfileView from "@/components/profile/ProfileView";

export const metadata = {
  title: "My Profile",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfilePage() {
  return <ProfileView />;
}
