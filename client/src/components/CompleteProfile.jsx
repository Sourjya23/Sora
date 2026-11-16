import React, { useState, useEffect } from "react";
import API from "../api/axios";
import { toast } from "./ui/Toast";

function CompleteProfile({ onComplete, user }) {
  const [nationalId, setNationalId] = useState("");
  const [intro, setIntro] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("beginner");
  const [skills, setSkills] = useState("");
  const [resume, setResume] = useState(null);
  
  const [projects, setProjects] = useState([
    { title: "", link: "", description: "" }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && user.profileCompleted) {
      setNationalId(user.nationalId || "");
      setIntro(user.intro || "");
      setExperienceLevel(user.experienceLevel || "beginner");
      setSkills(user.skills ? user.skills.join(", ") : "");
      if (user.projects && user.projects.length > 0) {
        setProjects(user.projects);
      }
    }
  }, [user]);

  const handleProjectChange = (index, field, value) => {
    const newProjects = [...projects];
    newProjects[index][field] = value;
    setProjects(newProjects);
  };

  const addProject = () => {
    setProjects([...projects, { title: "", link: "", description: "" }]);
  };

  const removeProject = (index) => {
    const newProjects = projects.filter((_, i) => i !== index);
    setProjects(newProjects);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("nationalId", nationalId);
      formData.append("intro", intro);
      formData.append("experienceLevel", experienceLevel);
      formData.append("skills", skills);
      formData.append("projects", JSON.stringify(projects));
      
      if (resume) {
        formData.append("resume", resume);
      }

      const response = await API.post("/profile/complete-profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`
        },
      });

      // Update user in local storage
      localStorage.setItem("user", JSON.stringify(response.data.user));
      onComplete(response.data.user);
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to complete profile";
      setError(errMsg);
      toast.error("Profile Save Failed", errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#041a2a]/80 border border-white/10 rounded-3xl p-8 max-w-3xl mx-auto backdrop-blur-xl shadow-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          {user && user.profileCompleted ? "Edit Your Profile" : "Complete Your Profile"}
        </h2>
        <p className="text-zinc-400 text-sm">
          {user && user.profileCompleted 
            ? "Modify your details below to update your candidate record."
            : "Please provide your details to verify your identity and get approved for interviews."}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">National ID Number</label>
            <input
              type="text"
              required
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-white/40 transition-all placeholder:text-zinc-500"
              placeholder="e.g. 123456789"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Experience Level</label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full bg-[#031320] border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-white/40 transition-all"
            >
              <option value="beginner">Beginner (0-2 years)</option>
              <option value="intermediate">Intermediate (2-5 years)</option>
              <option value="advanced">Advanced (5+ years)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Resume Upload (PDF/DOC)</label>
          <input
            type="file"
            required={!(user && user.resumeUrl)}
            accept=".pdf,.doc,.docx"
            onChange={(e) => setResume(e.target.files[0])}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-2 px-4 text-sm text-zinc-300 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 transition-all"
          />
          {user && user.resumeUrl && (
            <p className="text-xs text-emerald-400 mt-2">
              ✓ Resume already uploaded. Leave empty to keep current file.
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Skills (Comma separated)</label>
          <input
            type="text"
            required
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-white/40 transition-all placeholder:text-zinc-500"
            placeholder="React, Node.js, MongoDB..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Short Intro</label>
          <textarea
            required
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-white/40 transition-all min-h-[100px] placeholder:text-zinc-500"
            placeholder="Tell us a bit about yourself..."
          />
        </div>

        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Projects</h3>
            <button
              type="button"
              onClick={addProject}
              className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors border border-white/10"
            >
              + Add Project
            </button>
          </div>

          <div className="space-y-4">
            {projects.map((project, index) => (
              <div key={index} className="bg-white/[0.02] p-4 rounded-xl border border-white/10 relative">
                {projects.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeProject(index)}
                    className="absolute top-4 right-4 text-rose-400 hover:text-rose-300 text-xs font-semibold"
                  >
                    Remove
                  </button>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Title</label>
                    <input
                      type="text"
                      required
                      value={project.title}
                      onChange={(e) => handleProjectChange(index, "title", e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-lg py-2 px-3 text-sm text-white outline-none focus:border-white/40"
                      placeholder="E-commerce App"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Link</label>
                    <input
                      type="url"
                      required
                      value={project.link}
                      onChange={(e) => handleProjectChange(index, "link", e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-lg py-2 px-3 text-sm text-white outline-none focus:border-white/40"
                      placeholder="https://github.com/..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Description</label>
                  <input
                    type="text"
                    required
                    value={project.description}
                    onChange={(e) => handleProjectChange(index, "description", e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg py-2 px-3 text-sm text-white outline-none focus:border-white/40"
                    placeholder="Built with React and Node.js..."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 bg-white hover:bg-zinc-200 text-[#041826] font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-lg disabled:opacity-50"
        >
          {loading ? "Uploading & Saving..." : (user && user.profileCompleted ? "Update Profile Details" : "Submit Profile for Verification")}
        </button>
      </form>
    </div>
  );
}

export default CompleteProfile;
