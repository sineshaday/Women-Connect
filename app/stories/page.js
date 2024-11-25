"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ArrowLeftIcon, Ellipsis, Heart, MessageSquareIcon, BookmarkIcon, Send } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  getDocs,
  updateDoc,
  doc,
  getDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp 
} from "firebase/firestore";
import { formatDistanceToNow } from 'date-fns';
import Navbar from "@/components/layout/NavBar";

export default function Stories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userBookmarks, setUserBookmarks] = useState([]);

  const [expandedComments, setExpandedComments] = useState({});
  const [commentTexts, setCommentTexts] = useState({});
  const [submittingComment, setSubmittingComment] = useState(null);


  useEffect(() => {
    fetchStories();
    fetchUserBookmarks();
  }, []);

  const fetchStories = async () => {
    try {
      const storiesRef = collection(db, "stories");
      const q = query(storiesRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      const storiesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      
      setStories(storiesData);
    } catch (error) {
      console.error("Error fetching stories:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBookmarks = async () => {
    if (auth.currentUser) {
      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setUserBookmarks(userDoc.data()?.bookmarks || []);
        }
      } catch (error) {
        console.error("Error fetching bookmarks:", error);
      }
    }
  };

  const handleLike = async (storyId) => {
    if (!auth.currentUser) return;

    try {
      const storyRef = doc(db, "stories", storyId);
      const storyDoc = await getDoc(storyRef);
      const story = storyDoc.data();
      const userId = auth.currentUser.uid;
      
      if (story.likes?.includes(userId)) {
        await updateDoc(storyRef, {
          likes: arrayRemove(userId)
        });
      } else {
        await updateDoc(storyRef, {
          likes: arrayUnion(userId)
        });
      }
      
      // Update local state
      fetchStories();
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  const handleBookmark = async (storyId) => {
    if (!auth.currentUser) return;

    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      
      if (userBookmarks.includes(storyId)) {
        await updateDoc(userRef, {
          bookmarks: arrayRemove(storyId)
        });
        setUserBookmarks(prev => prev.filter(id => id !== storyId));
      } else {
        await updateDoc(userRef, {
          bookmarks: arrayUnion(storyId)
        });
        setUserBookmarks(prev => [...prev, storyId]);
      }
    } catch (error) {
      console.error("Error updating bookmark:", error);
    }
  };
  const handleCommentToggle = (storyId) => {
    setExpandedComments(prev => ({
      ...prev,
      [storyId]: !prev[storyId]
    }));
  };

  const handleCommentChange = (storyId, value) => {
    setCommentTexts(prev => ({
      ...prev,
      [storyId]: value
    }));
  };

  const handleCommentSubmit = async (storyId) => {
    if (!auth.currentUser) return;
    if (!commentTexts[storyId]?.trim()) return;

    setSubmittingComment(storyId);
    
    try {
      const storyRef = doc(db, "stories", storyId);
      const comment = {
        text: commentTexts[storyId].trim(),
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonymous',
        createdAt: new Date().toISOString(),
      };

      await updateDoc(storyRef, {
        comments: arrayUnion(comment)
      });

      // Clear comment text and refresh stories
      setCommentTexts(prev => ({
        ...prev,
        [storyId]: ''
      }));
      fetchStories();
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setSubmittingComment(null);
    }
  };


  if (loading) {
    return (
      <div className="max-w-md mx-auto mt-40">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        </div>
      </div>
    );
  }

  return (
    <><Navbar />
    <div className="mt-40"/>
    <div className="min-h-screen bg-gray-50"> {/* Added background color */}
        <div className="max-w-2xl mx-auto px-4 py-20"> {/* Increased max-width and added padding */}
            <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-6"> {/* Increased shadow and rounded corners */}
                <div className="flex items-center p-6 border-b"> {/* Increased padding */}
                    <Link href="/" className="cursor-pointer">
                        <ArrowLeftIcon className="h-6 w-6 text-gray-600 hover:text-gray-900" />
                    </Link>
                    <h1 className="flex-grow text-center text-2xl font-semibold">Stories</h1>
                    <img src="/com-icon.png" alt="Profile icon" className="w-14 h-10 rounded-full" />
                    <Ellipsis className="cursor-pointer h-6 w-6 text-gray-600 hover:text-gray-900" />
                </div>

                {stories.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No stories yet. Be the first to share!
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100"> {/* Added divider between posts */}
                        {stories.map((story) => (
                            <div key={story.id} className="p-6 hover:bg-gray-50 transition-colors"> {/* Increased padding and added hover effect */}
                                <div className="space-y-4"> {/* Added consistent vertical spacing */}
                                    <h2 className="text-xl font-bold text-gray-900">{story.title}</h2>
                                    <p className="text-gray-700 text-lg leading-relaxed">{story.content}</p>

                                    <div className="flex items-center text-gray-500 text-sm">
                                        <span>{formatDistanceToNow(story.createdAt)} ago</span>
                                        <span className="mx-2">•</span>
                                        <span>By {story.authorName || 'Anonymous'}</span>
                                        <span className="mx-2">•</span>
                                        <span>{Math.ceil(story.content.length / 1000)}min read</span>
                                    </div>

                                    {story.imageUrl && (
                                        <div className="mt-4">
                                            <img
                                                src={story.imageUrl}
                                                alt={story.title}
                                                className="w-full rounded-lg shadow-md" />
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-4">
                                        <button
                                            className="flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors"
                                            onClick={() => handleLike(story.id)}
                                        >
                                            <Heart className={`h-6 w-6 ${story.likes?.includes(auth.currentUser?.uid) ? "fill-pink-500 text-pink-500" : ""}`} />
                                            <span>{story.likes?.length || 0}</span>
                                        </button>
                                        <button
                                            className="flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors"
                                            onClick={() => handleCommentToggle(story.id)}
                                        >
                                            <MessageSquareIcon className="h-6 w-6" />
                                            <span>{story.comments?.length || 0}</span>
                                        </button>
                                        <button
                                            className="text-gray-600 hover:text-pink-600 transition-colors"
                                            onClick={() => handleBookmark(story.id)}
                                        >
                                            <BookmarkIcon
                                                className={`h-6 w-6 ${userBookmarks.includes(story.id) ? "fill-pink-500 text-pink-500" : ""}`} />
                                        </button>
                                    </div>

                                    {/* Comments Section */}
                                    {expandedComments[story.id] && (
                                        <div className="mt-6 space-y-4 bg-gray-50 p-4 rounded-lg"> {/* Increased spacing and added background */}
                                            {auth.currentUser && (
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="text"
                                                        value={commentTexts[story.id] || ''}
                                                        onChange={(e) => handleCommentChange(story.id, e.target.value)}
                                                        placeholder="Add a comment..."
                                                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white" />
                                                    <button
                                                        onClick={() => handleCommentSubmit(story.id)}
                                                        disabled={submittingComment === story.id || !commentTexts[story.id]?.trim()}
                                                        className="p-2 text-pink-500 hover:bg-white rounded-full disabled:opacity-50 transition-colors"
                                                    >
                                                        <Send className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            )}

                                            <div className="space-y-3">
                                                {story.comments?.slice().reverse().map((comment, index) => (
                                                    <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-medium">{comment.userName}</span>
                                                            <span className="text-sm text-gray-500">
                                                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                                            </span>
                                                        </div>
                                                        <p className="text-gray-700">{comment.text}</p>
                                                    </div>
                                                ))}

                                                {!story.comments?.length && (
                                                    <div className="text-center py-6 text-gray-500">
                                                        No comments yet. Be the first to comment!
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {auth.currentUser && (
            <Link
                href="/stories/create"
                className="fixed bottom-8 right-8 bg-pink-500 text-white p-4 rounded-full shadow-xl hover:bg-pink-600 transition-colors transform hover:scale-105"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            </Link>
        )}
    </div></> 
);}