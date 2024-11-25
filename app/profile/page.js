"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, PenIcon } from "lucide-react";
import { auth, db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Profile() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [profile, setProfile] = useState({
      name: '',
      email: '',
      photoURL: '/profile-image.png'
    });
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
      name: '',
      email: ''
    });
  
    useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          // Fetch user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.exists() 
            ? userDoc.data() 
            : { name: user.displayName || 'Anonymous' };
  
          const profileData = {
            name: userData.name || user.displayName || 'Anonymous',
            email: user.email,
            photoURL: userData.photoURL || user.photoURL || '/profile-image.png'
          };
  
          setProfile(profileData);
          setFormData({
            name: profileData.name,
            email: profileData.email
          });
        } else {
          router.push('/login');
        }
        setLoading(false);
      });
  
      return () => unsubscribe();
    }, [router]);
  
    const handleImageUpload = async (e) => {
      const file = e.target.files[0];
      if (!file || !auth.currentUser) return;
  
      try {
        setUpdating(true);
        const imageRef = ref(storage, `profile-images/${auth.currentUser.uid}`);
        await uploadBytes(imageRef, file);
        const photoURL = await getDownloadURL(imageRef);
  
        // Update Firestore
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          photoURL
        });
  
        setProfile(prev => ({ ...prev, photoURL }));
      } catch (error) {
        console.error("Error uploading image:", error);
      } finally {
        setUpdating(false);
      }
    };
  
    const handleNameUpdate = async () => {
      if (!auth.currentUser || formData.name.trim() === profile.name) {
        return;
      }
  
      try {
        setUpdating(true);
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          name: formData.name.trim()
        });
        setProfile(prev => ({ ...prev, name: formData.name.trim() }));
      } catch (error) {
        console.error("Error updating name:", error);
      } finally {
        setUpdating(false);
      }
    };
  
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };
  
    const handleLogout = async () => {
      try {
        await signOut(auth);
        router.push('/login');
      } catch (error) {
        console.error("Error logging out:", error);
      }
    };
  
    if (loading) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        </div>
      );
    }
  
    return (
      <div className="min-h-screen flex justify-center items-start bg-white pt-40">
        <div className="bg-white p-8 rounded-lg shadow-md w-[480px] mx-4">
          <div className="flex items-center mb-6">
            <Link href="/dashboard" className="cursor-pointer p-2">
              <ArrowLeftIcon className="w-6 h-6" />
            </Link>
            <h1 className="flex-grow text-center text-2xl font-semibold mr-8">Profile</h1>
          </div>
  
          <div className="relative flex justify-center mb-8">
            <div className="relative w-40 h-40">
              <img 
                src={profile.photoURL} 
                alt="Profile picture" 
                className="rounded-full w-full h-full object-cover border-4 border-white shadow-lg"
              />
              <label className="absolute bottom-2 right-2 bg-white p-3 rounded-full shadow-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <PenIcon className="h-5 w-5 text-pink-500" />
              </label>
            </div>
          </div>
  
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleNameUpdate}
                className="w-full bg-amber-100 text-center py-3 rounded-lg text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                readOnly
                className="w-full bg-amber-100 text-center py-3 rounded-lg text-lg cursor-not-allowed opacity-75"
              />
            </div>
  
            <button
              onClick={handleLogout}
              className="mt-8 bg-pink-500 text-white py-3 px-4 rounded-lg w-full shadow-md hover:bg-pink-600 transition-colors text-lg font-medium"
            >
              Log Out
            </button>
          </div>
        </div>
  
        {updating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
          </div>
        )}
      </div>
    );
  }