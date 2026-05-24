// Curated coding problem bank organized by difficulty
// Problems are inspired by popular LeetCode/GFG patterns

const PROBLEMS = {
  easy: [
    {
      title: "Two Sum",
      difficulty: "Easy",
      description: `Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
      examples: [
        { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
        { input: "nums = [3,2,4], target = 6", output: "[1,2]", explanation: "" },
        { input: "nums = [3,3], target = 6", output: "[0,1]", explanation: "" },
      ],
      testCases: [
        { input: "4\n2 7 11 15\n9", expectedOutput: "0 1" },
        { input: "3\n3 2 4\n6", expectedOutput: "1 2" },
        { input: "2\n3 3\n6", expectedOutput: "0 1" },
      ],
      constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9",
      tags: ["Array", "Hash Table"],
    },
    {
      title: "Reverse String",
      difficulty: "Easy",
      description: `Write a function that reverses a string. The input string is given as an array of characters.

You must do this by modifying the input array in-place with O(1) extra memory.`,
      examples: [
        { input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]', explanation: "" },
        { input: 's = ["H","a","n","n","a","h"]', output: '["h","a","n","n","a","H"]', explanation: "" },
        { input: 's = ["a"]', output: '["a"]', explanation: "" },
      ],
      testCases: [
        { input: "hello", expectedOutput: "olleh" },
        { input: "Hannah", expectedOutput: "hannaH" },
        { input: "a", expectedOutput: "a" },
      ],
      constraints: "1 <= s.length <= 10^5\ns[i] is a printable ascii character",
      tags: ["Two Pointers", "String"],
    },
    {
      title: "Valid Parentheses",
      difficulty: "Easy",
      description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
      examples: [
        { input: 's = "()"', output: "true", explanation: "" },
        { input: 's = "()[]{}"', output: "true", explanation: "" },
        { input: 's = "(]"', output: "false", explanation: "" },
      ],
      testCases: [
        { input: "()", expectedOutput: "true" },
        { input: "()[]{}", expectedOutput: "true" },
        { input: "(]", expectedOutput: "false" },
      ],
      constraints: "1 <= s.length <= 10^4\ns consists of parentheses only '()[]{}'",
      tags: ["Stack", "String"],
    },
    {
      title: "Palindrome Number",
      difficulty: "Easy",
      description: `Given an integer x, return true if x is a palindrome, and false otherwise.

An integer is a palindrome when it reads the same forward and backward.`,
      examples: [
        { input: "x = 121", output: "true", explanation: "121 reads as 121 from left to right and from right to left." },
        { input: "x = -121", output: "false", explanation: "From left to right, it reads -121. From right to left it becomes 121-." },
      ],
      testCases: [
        { input: "121", expectedOutput: "true" },
        { input: "-121", expectedOutput: "false" },
        { input: "10", expectedOutput: "false" },
      ],
      constraints: "-2^31 <= x <= 2^31 - 1",
      tags: ["Math"],
    },
    {
      title: "FizzBuzz",
      difficulty: "Easy",
      description: `Given an integer n, return a string array answer (1-indexed) where:
- answer[i] == "FizzBuzz" if i is divisible by 3 and 5.
- answer[i] == "Fizz" if i is divisible by 3.
- answer[i] == "Buzz" if i is divisible by 5.
- answer[i] == i (as a string) if none of the above conditions are true.`,
      examples: [
        { input: "n = 3", output: '["1","2","Fizz"]', explanation: "" },
        { input: "n = 5", output: '["1","2","Fizz","4","Buzz"]', explanation: "" },
        { input: "n = 15", output: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]', explanation: "" },
      ],
      testCases: [
        { input: "3", expectedOutput: "1\n2\nFizz" },
        { input: "5", expectedOutput: "1\n2\nFizz\n4\nBuzz" },
        { input: "15", expectedOutput: "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz" },
      ],
      constraints: "1 <= n <= 10^4",
      tags: ["Math", "String"],
    },
  ],

  medium: [
    {
      title: "Longest Substring Without Repeating Characters",
      difficulty: "Medium",
      description: `Given a string s, find the length of the longest substring without repeating characters.`,
      examples: [
        { input: 's = "abcabcbb"', output: "3", explanation: 'The answer is "abc", with the length of 3.' },
        { input: 's = "bbbbb"', output: "1", explanation: 'The answer is "b", with the length of 1.' },
        { input: 's = "pwwkew"', output: "3", explanation: 'The answer is "wke", with the length of 3.' },
      ],
      testCases: [
        { input: "abcabcbb", expectedOutput: "3" },
        { input: "bbbbb", expectedOutput: "1" },
        { input: "pwwkew", expectedOutput: "3" },
      ],
      constraints: "0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces",
      tags: ["Hash Table", "String", "Sliding Window"],
    },
    {
      title: "Container With Most Water",
      difficulty: "Medium",
      description: `You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the i-th line are (i, 0) and (i, height[i]).

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return the maximum amount of water a container can store.`,
      examples: [
        { input: "height = [1,8,6,2,5,4,8,3,7]", output: "49", explanation: "The max area of water the container can contain is 49." },
        { input: "height = [1,1]", output: "1", explanation: "" },
        { input: "height = [4,3,2,1,4]", output: "16", explanation: "" },
      ],
      testCases: [
        { input: "9\n1 8 6 2 5 4 8 3 7", expectedOutput: "49" },
        { input: "2\n1 1", expectedOutput: "1" },
        { input: "5\n4 3 2 1 4", expectedOutput: "16" },
      ],
      constraints: "n == height.length\n2 <= n <= 10^5\n0 <= height[i] <= 10^4",
      tags: ["Array", "Two Pointers", "Greedy"],
    },
    {
      title: "3Sum",
      difficulty: "Medium",
      description: `Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.

Notice that the solution set must not contain duplicate triplets.`,
      examples: [
        { input: "nums = [-1,0,1,2,-1,-4]", output: "[[-1,-1,2],[-1,0,1]]", explanation: "" },
        { input: "nums = [0,1,1]", output: "[]", explanation: "" },
        { input: "nums = [0,0,0]", output: "[[0,0,0]]", explanation: "" },
      ],
      testCases: [
        { input: "6\n-1 0 1 2 -1 -4", expectedOutput: "-1 -1 2\n-1 0 1" },
        { input: "3\n0 1 1", expectedOutput: "" },
        { input: "3\n0 0 0", expectedOutput: "0 0 0" },
      ],
      constraints: "3 <= nums.length <= 3000\n-10^5 <= nums[i] <= 10^5",
      tags: ["Array", "Two Pointers", "Sorting"],
    },
    {
      title: "Merge Intervals",
      difficulty: "Medium",
      description: `Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.`,
      examples: [
        { input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]", explanation: "Since intervals [1,3] and [2,6] overlap, merge them into [1,6]." },
        { input: "intervals = [[1,4],[4,5]]", output: "[[1,5]]", explanation: "Intervals [1,4] and [4,5] are considered overlapping." },
        { input: "intervals = [[1,4],[2,3]]", output: "[[1,4]]", explanation: "Interval [2,3] is fully contained in [1,4]." },
      ],
      testCases: [
        { input: "4\n1 3\n2 6\n8 10\n15 18", expectedOutput: "1 6\n8 10\n15 18" },
        { input: "2\n1 4\n4 5", expectedOutput: "1 5" },
        { input: "2\n1 4\n2 3", expectedOutput: "1 4" },
      ],
      constraints: "1 <= intervals.length <= 10^4\nintervals[i].length == 2\n0 <= start_i <= end_i <= 10^4",
      tags: ["Array", "Sorting"],
    },
    {
      title: "LRU Cache",
      difficulty: "Medium",
      description: `Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.

Implement the LRUCache class:
- LRUCache(int capacity): Initialize the LRU cache with positive size capacity.
- int get(int key): Return the value of the key if the key exists, otherwise return -1.
- void put(int key, int value): Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity from this operation, evict the least recently used key.

The functions get and put must each run in O(1) average time complexity.`,
      examples: [
        {
          input: '["LRUCache","put","put","get","put","get","put","get","get","get"]\n[[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]',
          output: "[null,null,null,1,null,-1,null,-1,3,4]",
          explanation: "",
        },
        {
          input: '["LRUCache","put","get"]\n[[1],[2,1],[2]]',
          output: "[null,null,1]",
          explanation: "",
        },
        {
          input: '["LRUCache","put","put","get"]\n[[1],[2,1],[3,2],[2]]',
          output: "[null,null,null,-1]",
          explanation: "",
        },
      ],
      testCases: [
        { input: "LRUCache 2\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2\nput 4 4\nget 1\nget 3\nget 4", expectedOutput: "1\n-1\n-1\n3\n4" },
        { input: "LRUCache 1\nput 2 1\nget 2", expectedOutput: "1" },
        { input: "LRUCache 1\nput 2 1\nput 3 2\nget 2", expectedOutput: "-1" },
      ],
      constraints: "1 <= capacity <= 3000\n0 <= key <= 10^4\n0 <= value <= 10^5\nAt most 2 * 10^5 calls will be made to get and put",
      tags: ["Hash Table", "Linked List", "Design"],
    },
  ],

  hard: [
    {
      title: "Trapping Rain Water",
      difficulty: "Hard",
      description: `Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.`,
      examples: [
        { input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", output: "6", explanation: "The elevation map can trap 6 units of rain water." },
        { input: "height = [4,2,0,3,2,5]", output: "9", explanation: "" },
        { input: "height = [0,2,0]", output: "0", explanation: "" },
      ],
      testCases: [
        { input: "12\n0 1 0 2 1 0 1 3 2 1 2 1", expectedOutput: "6" },
        { input: "6\n4 2 0 3 2 5", expectedOutput: "9" },
        { input: "3\n0 2 0", expectedOutput: "0" },
      ],
      constraints: "n == height.length\n1 <= n <= 2 * 10^4\n0 <= height[i] <= 10^5",
      tags: ["Array", "Two Pointers", "Dynamic Programming", "Stack"],
    },
    {
      title: "Median of Two Sorted Arrays",
      difficulty: "Hard",
      description: `Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.

The overall run time complexity should be O(log (m+n)).`,
      examples: [
        { input: "nums1 = [1,3], nums2 = [2]", output: "2.0", explanation: "merged array = [1,2,3] and median is 2." },
        { input: "nums1 = [1,2], nums2 = [3,4]", output: "2.5", explanation: "merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5." },
        { input: "nums1 = [0,0], nums2 = [0,0]", output: "0.0", explanation: "merged array = [0,0,0,0] and median is 0." },
      ],
      testCases: [
        { input: "2\n1 3\n1\n2", expectedOutput: "2.0" },
        { input: "2\n1 2\n2\n3 4", expectedOutput: "2.5" },
        { input: "2\n0 0\n2\n0 0", expectedOutput: "0.0" },
      ],
      constraints: "nums1.length == m\nnums2.length == n\n0 <= m <= 1000\n0 <= n <= 1000\n1 <= m + n <= 2000",
      tags: ["Array", "Binary Search", "Divide and Conquer"],
    },
    {
      title: "Serialize and Deserialize Binary Tree",
      difficulty: "Hard",
      description: `Design an algorithm to serialize and deserialize a binary tree. There is no restriction on how your serialization/deserialization algorithm should work. You just need to ensure that a binary tree can be serialized to a string and this string can be deserialized to the original tree structure.`,
      examples: [
        { input: "root = [1,2,3,null,null,4,5]", output: "[1,2,3,null,null,4,5]", explanation: "" },
        { input: "root = []", output: "[]", explanation: "" },
        { input: "root = [1]", output: "[1]", explanation: "" },
      ],
      testCases: [
        { input: "1 2 3 null null 4 5", expectedOutput: "1 2 3 null null 4 5" },
        { input: "", expectedOutput: "" },
        { input: "1", expectedOutput: "1" },
      ],
      constraints: "The number of nodes in the tree is in the range [0, 10^4]\n-1000 <= Node.val <= 1000",
      tags: ["Tree", "DFS", "BFS", "Design"],
    },
  ],
};

// Keywords for detecting fullstack/advanced roles
const FULLSTACK_KEYWORDS = [
  "fullstack", "full-stack", "full stack",
  "senior", "lead", "architect", "principal", "staff",
  "react", "angular", "vue", "node", "next.js", "nuxt",
  "mern", "mean", "django", "spring boot",
  "system design", "microservices", "distributed",
  "backend", "back-end", "frontend", "front-end",
];

const BASIC_KEYWORDS = [
  "intern", "junior", "fresher", "trainee", "entry-level",
  "data entry", "support", "qa", "tester", "testing",
  "html", "css", "wordpress",
];

/**
 * Analyze the JD text and return a difficulty level
 */
function analyzeDifficulty(jobDescription) {
  const jdLower = (jobDescription || "").toLowerCase();

  // Check for basic/intern roles first
  const basicMatch = BASIC_KEYWORDS.some((kw) => jdLower.includes(kw));
  if (basicMatch) return "easy";

  // Check for fullstack/senior roles
  const fullstackMatch = FULLSTACK_KEYWORDS.filter((kw) => jdLower.includes(kw));
  if (fullstackMatch.length >= 2) return "hard";
  if (fullstackMatch.length >= 1) return "medium";

  // Default to medium
  return "medium";
}

/**
 * Pick a random problem for the given difficulty
 */
function getRandomProblem(difficulty) {
  const pool = PROBLEMS[difficulty] || PROBLEMS.medium;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

/**
 * Generate a problem based on JD analysis
 */
function generateProblem(jobDescription) {
  const difficulty = analyzeDifficulty(jobDescription);
  const problem = getRandomProblem(difficulty);
  return {
    ...problem,
    detectedDifficulty: difficulty,
  };
}

module.exports = { generateProblem, analyzeDifficulty, PROBLEMS };
