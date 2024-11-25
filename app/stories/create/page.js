"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function CreateStory() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    imageBase64: "", // We'll store the image as base64
  });
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      try {
        // Convert image to base64
        const base64 = await convertToBase64(file);
        setFormData(prev => ({
          ...prev,
          imageBase64: base64
        }));
        setImagePreview(base64);
      } catch (error) {
        console.error("Error processing image:", error);
        setError("Error processing image. Please try again.");
      }
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const storyData = {
        title: formData.title,
        content: formData.content,
        imageUrl: formData.imageBase64, // Store base64 image directly
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || "Anonymous",
        createdAt: serverTimestamp(),
        likes: [],
        comments: []
      };

      await addDoc(collection(db, "stories"), storyData);
      router.push("/stories");
    } catch (error) {
      console.error("Error creating story:", error);
      setError("Failed to create story. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto mt-40 p-4">
      <div className="flex items-center mb-6">
        <Link href="/stories" className="cursor-pointer">
          <ArrowLeftIcon />
        </Link>
        <h1 className="flex-grow text-center text-2xl font-bold">Forum</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Content
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows={8}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Image (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full"
          />
          {imagePreview && (
            <div className="mt-2">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-48 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  setFormData(prev => ({ ...prev, imageBase64: "" }));
                }}
                className="mt-2 text-red-500 text-sm"
              >
                Remove Image
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-600 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Story"}
        </button>
      </form>
    </div>
  );
}