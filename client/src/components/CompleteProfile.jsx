import React, { useState, useEffect } from "react";
import API from "../api/axios";

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
      setError(err.response?.data?.message || "Failed to complete profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/40 border border-zinc-200 rounded-3xl p-8 max-w-3xl mx-auto backdrop-blur-md">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">
          {user && user.profileCompleted ? "Edit Your Profile" : "Complete Your Profile"}
        </h2>
        <p className="text-zinc-600 text-sm">
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
            <label className="block text-xs font-medium text-zinc-600 mb-1.5 uppercase">National ID Number</label>
            <input
              type="text"
              required
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              className="w-full bg-white/90 border border-zinc-200 rounded-xl py-3 px-4 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-all"
              placeholder="e.g. 123456789"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5 uppercase">Experience Level</label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full bg-white/90 border border-zinc-200 rounded-xl py-3 px-4 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-all"
            >
              <option value="beginner">Beginner (0-2 years)</option>
              <option value="intermediate">Intermediate (2-5 years)</option>
              <option value="advanced">Advanced (5+ years)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1.5 uppercase">Resume Upload (PDF/DOC)</label>
          <input
            type="file"
            required={!(user && user.resumeUrl)}
            accept=".pdf,.doc,.docx"
            onChange={(e) => setResume(e.target.files[0])}
            className="w-full bg-white/90 border border-zinc-200 rounded-xl py-2 px-4 text-sm text-zinc-700 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-white hover:file:bg-violet-500 transition-all"
          />
          {user && user.resumeUrl && (
            <p className="text-xs text-emerald-400 mt-2">
              ✓ Resume already uploaded. Leave empty to keep current file.
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1.5 uppercase">Skills (Comma separated)</label>
          <input
            type="text"
            required
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            className="w-full bg-white/90 border border-zinc-200 rounded-xl py-3 px-4 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-all"
            placeholder="React, Node.js, MongoDB..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1.5 uppercase">Short Intro</label>
          <textarea
            required
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            className="w-full bg-white/90 border border-zinc-200 rounded-xl py-3 px-4 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-all min-h-[100px]"
            placeholder="Tell us a bit about yourself..."
          />
        </div>

        <div className="pt-4 border-t border-zinc-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-800 uppercase tracking-wider">Projects</h3>
            <button
              type="button"
              onClick={addProject}
              className="text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-900 px-3 py-1.5 rounded-lg transition-colors"
            >
              + Add Project
            </button>
          </div>

          <div className="space-y-4">
            {projects.map((project, index) => (
              <div key={index} className="bg-zinc-50/50 p-4 rounded-xl border border-zinc-200/50 relative">
                {projects.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeProject(index)}
                    className="absolute top-4 right-4 text-rose-500 hover:text-rose-400 text-xs font-semibold"
                  >
                    Remove
                  </button>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase">Title</label>
                    <input
                      type="text"
                      required
                      value={project.title}
                      onChange={(e) => handleProjectChange(index, "title", e.target.value)}
                      className="w-full bg-white border border-zinc-300 rounded-lg py-2 px-3 text-sm text-zinc-800 outline-none focus:border-zinc-900"
                      placeholder="E-commerce App"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase">Link (Must be valid URL)</label>
                    <input
                      type="url"
                      required
                      value={project.link}
                      onChange={(e) => handleProjectChange(index, "link", e.target.value)}
                      className="w-full bg-white border border-zinc-300 rounded-lg py-2 px-3 text-sm text-zinc-800 outline-none focus:border-zinc-900"
                      placeholder="https://github.com/..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase">Description</label>
                  <input
                    type="text"
                    required
                    value={project.description}
                    onChange={(e) => handleProjectChange(index, "description", e.target.value)}
                    className="w-full bg-white border border-zinc-300 rounded-lg py-2 px-3 text-sm text-zinc-800 outline-none focus:border-zinc-900"
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
          className="w-full mt-6 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow disabled:opacity-50"
        >
          {loading ? "Uploading & Saving..." : (user && user.profileCompleted ? "Update Profile Details" : "Submit Profile for Verification")}
        </button>
      </form>
    </div>
  );
}

export default CompleteProfile;
