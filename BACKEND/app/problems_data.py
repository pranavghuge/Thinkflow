import json


PROBLEMS = [
    {
        "id": "ah",
        "title": "Two Sum",
        "slug": "two-sum",
        "statement": (
            "You are given an array of integers nums and an integer target, "
            "return indices of the two numbers such that they add up to target. "
            "You may assume that each input would have exactly one solution, "
            "and you may not use the same element twice. "
            "You can return the answer in any order."
        ),
        "difficulty": "Easy",
        "recognition_minutes": 1,
        "pattern": "Array & Hashing",
        "category": "Arrays & Strings",
        "constraints": json.dumps([
            "2 <= nums.length <= 10^4",
            "-10^9 <= nums[i] <= 10^9",
            "-10^9 <= target <= 10^9",
        ]),
        "examples": json.dumps([
            {
                "input": "nums = [2,7,11,15], target = 9",
                "output": "[0,1]",
                "explanation": (
                    "Because nums[0] + nums[1] == 9, we return [0, 1]."
                ),
            }
        ]),
        "time_complexity": "O(n)",
        "space_complexity": "O(n)",
    },
    {
        "id": "ah1",
        "title": "Contains Duplicate",
        "slug": "contains-duplicate",
        "statement": (
            "Given an integer array nums, return true if any value appears "
            "at least twice in the array, and return false if every element "
            "is distinct."
        ),
        "difficulty": "Easy",
        "recognition_minutes": 1,
        "pattern": "Array & Hashing",
        "category": "Arrays & Strings",
        "constraints": json.dumps([
            "1 <= nums.length <= 10^5",
            "-10^9 <= nums[i] <= 10^9",
        ]),
        "examples": json.dumps([
            {
                "input": "nums = [1,2,3,1]",
                "output": "true",
                "explanation": (
                    "The element 1 occurs at the indices 0 and 3"
                ),
            }
        ]),
        "time_complexity": "O(n)",
        "space_complexity": "O(n)",
    },
    {
        "id": "ah2",
        "title": "Group Anagrams",
        "slug": "group-anagrams",
        "statement": (
            "Given an array of strings strs, group the anagrams together. "
            "You can return the answer in any order."
        ),
        "difficulty": "Medium",
        "recognition_minutes": 2,
        "pattern": "Array & Hashing",
        "category": "Arrays & Strings",
        "constraints": json.dumps([
            "1 <= strs.length <= 10^4",
            "0 <= strs[i].length <= 100",
            "strs[i] consists of lowercase English letters.",
        ]),
        "examples": json.dumps([
            {
                "input": 'strs = ["eat","tea","tan","ate","nat","bat"]',
                "output": "[['bat'],['nat','tan'],['ate','eat','tea']]",
                "explanation": (
                    "There is no string in strs that can be rearranged to form bat.,"
                    "The strings nat and tan are anagrams as they can be rearranged "
                    "to form each other.,"
                    "The strings ate, eat, and tea are anagrams as they can be "
                    "rearranged to form each other."
                ),
            }
        ]),
        "time_complexity": "O(n.klogk)",
        "space_complexity": "O(n.k)",
    },
    {
        "id": "ah3",
        "title": "Longest Consecutive Sequence",
        "slug": "longest-consecutive-sequence",
        "statement": (
            "Given an unsorted array of integers nums, return the length of "
            "the longest consecutive elements sequence. You must write an "
            "algorithm that runs in O(n) time."
        ),
        "difficulty": "Medium",
        "recognition_minutes": 2,
        "pattern": "Array & Hashing",
        "category": "Arrays & Strings",
        "constraints": json.dumps([
            "0 <= nums.length <= 10^5",
            "-10^9 <= nums[i] <= 10^9",
        ]),
        "examples": json.dumps([
            {
                "input": "nums = [100,4,200,1,3,2]",
                "output": "4",
                "explanation": (
                    "The longest consecutive elements sequence is "
                    "[1, 2, 3, 4]. Therefore its length is 4."
                ),
            }
        ]),
        "time_complexity": "O(n)",
        "space_complexity": "O(n)",
    },
    {
        "id": "ah4",
        "title": "Top K Frequent Elements",
        "slug": "top-k-frequent-elements",
        "statement": (
            "Given an integer array nums and an integer k, return the k most "
            "frequent elements. You may return the answer in any order."
        ),
        "difficulty": "Medium",
        "recognition_minutes": 2,
        "pattern": "Array & Hashing",
        "category": "Arrays & Strings",
        "constraints": json.dumps([
            "1 <= nums.length <= 10^5",
            "-10^4 <= nums[i] <= 10^4",
            "k is in the range [1, the number of unique elements in the array].",
            "It is guaranteed that the answer is unique",
        ]),
        "examples": json.dumps([
            {
                "input": "nums = [1,1,1,2,2,3], k = 2",
                "output": "[1,2]",
            }
        ]),
        "time_complexity": "O(N)",
        "space_complexity": "O(N)",
    },
    {
        "id": "tp1",
        "title": "Valid Palindrome",
        "slug": "valid-palindrome",
        "statement": (
            "A phrase is a palindrome if, after converting all uppercase "
            "letters into lowercase letters and removing all non-alphanumeric "
            "characters, it reads the same forward and backward. Alphanumeric "
            "characters include letters and numbers. Given a string s, return "
            "true if it is a palindrome, or false otherwise."
        ),
        "difficulty": "Easy",
        "recognition_minutes": 1,
        "pattern": "Two Pointers",
        "category": "Arrays & Strings",
        "constraints": json.dumps([
            "1 <= s.length <= 2 * 10^5",
            "s consists only of printable ASCII characters.",
        ]),
        "examples": json.dumps([
            {
                "input": 's = "A man, a plan, a canal: Panama"',
                "output": "true",
                "explanation": '"amanaplanacanalpanama" is a palindrome.',
            }
        ]),
        "time_complexity": "O(n)",
        "space_complexity": "O(1)",
    },
    {
        "id": "tp2",
        "title": "3sum",
        "slug": "3sum",
        "statement": (
            "Given an integer array nums, return all the triplets "
            "[nums[i], nums[j], nums[k]] such that i != j, i != k, and "
            "j != k, and nums[i] + nums[j] + nums[k] == 0. Notice that "
            "the solution set must not contain duplicate triplets."
        ),
        "difficulty": "Medium",
        "recognition_minutes": 2,
        "pattern": "Two Pointers",
        "category": "Arrays & Strings",
        "constraints": json.dumps([
            "3 <= nums.length <= 3000",
            "-10^5 <= nums[i] <= 10^5",
        ]),
        "examples": json.dumps([
            {
                "input": "nums = [-1,0,1,2,-1,-4]",
                "output": "[[-1,-1,2],[-1,0,1]]",
                "explanation": (
                    "nums[0] + nums[1] + nums[2] = (-1) + 0 + 1 = 0,"
                    "nums[1] + nums[2] + nums[4] = 0 + 1 + (-1) = 0,"
                    "nums[0] + nums[3] + nums[4] = (-1) + 2 + (-1) = 0,"
                    "The distinct triplets are [-1,0,1] and [-1,-1,2]."
                    "Notice that the order of the output and the order of "
                    "the triplets does not matter"
                ),
            }
        ]),
        "time_complexity": "O(n^2)",
        "space_complexity": "O(1)",
    },
    {
        "id": "tp3",
        "title": "Contains with Most Water",
        "slug": "contains-with-most-water",
        "statement": (
            "You are given an integer array height of length n. There are n "
            "vertical lines drawn such that the two endpoints of the ith line "
            "are (i, 0) and (i, height[i]). Find two lines that together with "
            "the x-axis form a container, such that the container contains the "
            "most water. Return the maximum amount of water a container can "
            "store. Notice that you may not slant the container."
        ),
        "difficulty": "Medium",
        "recognition_minutes": 2,
        "pattern": "Two Pointers",
        "category": "Arrays & Strings",
        "constraints": json.dumps([
            "n == height.length",
            "2 <= n <= 10^5",
            "0 <= height[i] <= 10^4",
        ]),
        "examples": json.dumps([
            {
                "input": "height = [1,8,6,2,5,4,8,3,7]",
                "output": "49",
                "explanation": (
                    "The above vertical lines are represented by array "
                    "[1,8,6,2,5,4,8,3,7]. In this case, the max area of "
                    "water (blue section) the container can contain is 49."
                ),
            }
        ]),
        "time_complexity": "O(n)",
        "space_complexity": "O(1)",
    },
    {
        "id": "sw1",
        "title": "Best time to buy and sell stocks",
        "slug": "best-time-to-buy-and-sell-stocks",
        "statement": (
            "You are given an array prices where prices[i] is the price of a "
            "given stock on the ith day. You want to maximize your profit by "
            "choosing a single day to buy one stock and choosing a different "
            "day in the future to sell that stock. Return the maximum profit "
            "you can achieve from this transaction. If you cannot achieve "
            "any profit, return 0."
        ),
        "difficulty": "Easy",
        "recognition_minutes": 1,
        "pattern": "Sliding Window",
        "category": "Arrays & Strings",
        "constraints": json.dumps([
            "1 <= prices.length <= 10^5",
            "0 <= prices[i] <= 10^4",
        ]),
        "examples": json.dumps([
            {
                "input": "prices = [7,1,5,3,6,4]",
                "output": "5",
                "explanation": (
                    "Buy on day 2 (price = 1) and sell on day 5 "
                    "(price = 6), profit = 6-1 = 5. Note that buying "
                    "on day 2 and selling on day 1 is not allowed because "
                    "you must buy before you sell."
                ),
            }
        ]),
        "time_complexity": "O(n)",
        "space_complexity": "O(1)",
    },
    {
        "id": "sw2",
        "title": "Longest Substring without Repeating Characters",
        "slug": "longest-substring-without-repeating-characters",
        "statement": (
            "Given a string s, find the length of the longest substring "
            "without duplicate characters."
        ),
        "difficulty": "Medium",
        "recognition_minutes": 2,
        "pattern": "Sliding Window",
        "category": "Arrays & Strings",
        "constraints": json.dumps([
            "0 <= s.length <= 10^5",
            "s consists of English letters, digits, symbols and spaces.",
        ]),
        "examples": json.dumps([
            {
                "input": "s = 'abcabcbb'",
                "output": "3",
                "explanation": (
                    "The answer is 'abc', with the length of 3. "
                    "Note that 'bca' and 'cab' are also correct answers."
                ),
            }
        ]),
        "time_complexity": "O(n)",
        "space_complexity": "O(min(n,m))",
    },
    {
        "id": "sw3",
        "title": "Longest Repeating Character Replacement",
        "slug": "longest-repeating-character-replacement",
        "statement": (
            "You are given a string s and an integer k. You can choose any "
            "character of the string and change it to any other uppercase "
            "English character. You can perform this operation at most k "
            "times. Return the length of the longest substring containing "
            "the same letter you can get after performing the above operations."
        ),
        "difficulty": "Medium",
        "recognition_minutes": 2,
        "pattern": "Sliding Window",
        "category": "Arrays & Strings",
        "constraints": json.dumps([
            "1 <= s.length <= 10^5",
            "s consists of only uppercase English letters.",
            "0 <= k <= s.length",
        ]),
        "examples": json.dumps([
            {
                "input": "s = 'ABAB', k = 2",
                "output": "4",
                "explanation": (
                    "Replace the two 'A's with two 'B's or vice versa."
                ),
            }
        ]),
        "time_complexity": "O(n)",
        "space_complexity": "O(1)(26 uppercase letters)",
    },
    {
        "id": "sw4",
        "title": "Sliding Window Maximum",
        "slug": "sliding-window-maximum",
        "statement": (
            "You are given an array of integers nums, there is a sliding "
            "window of size k which is moving from the very left of the "
            "array to the very right. You can only see the k numbers in "
            "the window. Each time the sliding window moves right by one "
            "position, return the max sliding window."
        ),
        "difficulty": "Hard",
        "recognition_minutes": 3,
        "pattern": "Sliding Window",
        "category": "Arrays & Strings",
        "constraints": json.dumps([
            "1 <= nums.length <= 10^5",
            "-10^4 <= nums[i] <= 10^4",
            "1 <= k <= nums.length",
        ]),
        "examples": json.dumps([
            {
                "input": "nums = [1,3,-1,-3,5,3,6,7], k = 3",
                "output": "[3,3,5,5,6,7]",
                "explanation": (
                    "A window of size k moves one position to the right "
                    "after each step. For every window, return the largest "
                    "element inside it. A brute-force solution scans all k "
                    "elements for every window, resulting in O(n × k) time. "
                    "A more efficient approach keeps only the useful "
                    "candidates for the maximum. As the window moves: "
                    "Remove elements that are no longer inside the window. "
                    "Ignore smaller elements that can never become the "
                    "maximum. The front always represents the current "
                    "window's maximum. This allows the entire array to be "
                    "processed in O(n) time"
                ),
            }
        ]),
        "time_complexity": "O(n)",
        "space_complexity": "O(k)",
    },
    {
        "id": "s1",
        "title": "Valid Parentheses",
        "slug": "valid-parentheses",
        "statement": (
            "Given a string s containing just the characters '(', ')', "
            "'{', '}', '[' and ']', determine if the input string is valid. "
            "An input string is valid if: Open brackets must be closed by "
            "the same type of brackets, Open brackets must be closed in the "
            "correct order, Every close bracket has a corresponding open "
            "bracket of the same type."
        ),
        "difficulty": "Easy",
        "recognition_minutes": 1,
        "pattern": "Stack",
        "category": "Linked Lists & Stacks",
        "constraints": json.dumps([
            "1 <= s.length <= 10^4",
            "s consists of parentheses only '()[]{}'.",
        ]),
        "examples": json.dumps([
            {
                "input": "s = '()[]{}'",
                "output": "true",
            }
        ]),
        "time_complexity": "O(n)",
        "space_complexity": "O(n)",
    },
    {
        "id": "s2",
        "title": "Daily Temp",
        "slug": "daily-temp",
        "statement": (
            "Given an array of integers temperatures represents the daily "
            "temperatures, return an array answer such that answer[i] is "
            "the number of days you have to wait after the ith day to get "
            "a warmer temperature. If there is no future day for which "
            "this is possible, keep answer[i] == 0 instead."
        ),
        "difficulty": "Medium",
        "recognition_minutes": 2,
        "pattern": "Stack",
        "category": "Linked Lists & Stacks",
        "constraints": json.dumps([
            "1 <= temperatures.length <= 10^5",
            "30 <= temperatures[i] <= 100",
        ]),
        "examples": json.dumps([
            {
                "input": "temperatures = [73,74,75,71,69,72,76,73]",
                "output": "[1,1,4,2,1,1,0,0]",
            }
        ]),
        "time_complexity": "O(n)",
        "space_complexity": "O(n)",
    },
    {
        "id": "s3",
        "title": "Largest Rectangle in Histogram",
        "slug": "largest-rectangle-in-histogram",
        "statement": (
            "Given an array of integers heights representing the "
            "histogram's bar height where the width of each bar is 1, "
            "return the area of the largest rectangle in the histogram."
        ),
        "difficulty": "Hard",
        "recognition_minutes": 3,
        "pattern": "Stack",
        "category": "Linked Lists & Stacks",
        "constraints": json.dumps([
            "1 <= heights.length <= 10^5",
            "0 <= heights[i] <= 10^4",
        ]),
        "examples": json.dumps([
            {
                "input": "heights = [2,1,5,6,2,3]",
                "output": "10",
                "explanation": (
                    "The above is a histogram where width of each bar is 1. "
                    "The largest rectangle is shown in the red area, which "
                    "has an area = 10 units."
                ),
            }
        ]),
        "time_complexity": "O(n)",
        "space_complexity": "O(n)",
    },
    {
        "id": "bs1",
        "title": "Binary Search",
        "slug": "binary-search",
        "statement": (
            "Given an array of integers nums which is sorted in ascending "
            "order, and an integer target, write a function to search target "
            "in nums. If target exists, then return its index. Otherwise, "
            "return -1. You must write an algorithm with O(log n) runtime "
            "complexity."
        ),
        "difficulty": "Easy",
        "recognition_minutes": 1,
        "pattern": "Binary Search",
        "category": "Heap & Sorting",
        "constraints": json.dumps([
            "1 <= nums.length <= 10^4",
            "-10^4 < nums[i], target < 10^4",
            "All the integers in nums are unique.",
            "nums is sorted in ascending order.",
        ]),
        "examples": json.dumps([
            {
                "input": "nums = [-1,0,3,5,9,12], target = 9",
                "output": "4",
                "explanation": "9 exists in nums and its index is 4",
            }
        ]),
        "time_complexity": "O(logn)",
        "space_complexity": "O(1)",
    },
    {
        "id": "bs2",
        "title": "Search in Rotated Sorted Array",
        "slug": "search-in-rotated-sorted-array",
        "statement": (
            "There is an integer array nums sorted in ascending order "
            "(with distinct values). Prior to being passed to your function, "
            "nums is possibly left rotated at an unknown index k "
            "(1 <= k < nums.length) such that the resulting array is "
            "[nums[k], nums[k+1], ..., nums[n-1], nums[0], nums[1], ..., "
            "nums[k-1]] (0-indexed). For example, [0,1,2,4,5,6,7] might be "
            "left rotated by 3 indices and become [4,5,6,7,0,1,2]. Given "
            "the array nums after the possible rotation and an integer "
            "target, return the index of target if it is in nums, or -1 "
            "if it is not in nums. You must write an algorithm with "
            "O(log n) runtime complexity."
        ),
        "difficulty": "Medium",
        "recognition_minutes": 2,
        "pattern": "Binary Search",
        "category": "Heap & Sorting",
        "constraints":json.dumps([
            "1 <= nums.length <= 5000",
            "-10^4 <= nums[i] <= 10^4",
            "All values of nums are unique.",
            "nums is an ascending array that is possibly rotated.",
            "-10^4 <= target <= 10^4",
        ]),
        "examples": json.dumps([
            {
                "input": "nums = [4,5,6,7,0,1,2], target = 0",
                "output": "4",
            }
        ]),
        "time_complexity": "O(logn)",
        "space_complexity": "O(1)",
    },
    {
        "id": "bs3",
        "title": "Find Minimum in Rotated Sorted Array",
        "slug": "find-minimum-in-rotated-sorted-array",
        "category": "Heap & Sorting",
        "pattern": "Binary Search",
        "difficulty": "Medium",
        "recognition_minutes": 2,
        "statement": "Suppose an array of length n sorted in ascending order is rotated between 1 and n times. For example, the array nums = [0,1,2,4,5,6,7] might become:[4,5,6,7,0,1,2] if it was rotated 4 times,[0,1,2,4,5,6,7] if it was rotated 7 times.Notice that rotating an array [a[0], a[1], a[2], ..., a[n-1]] 1 time results in the array [a[n-1], a[0], a[1], a[2], ..., a[n-2]].Given the sorted rotated array nums of unique elements, return the minimum element of this array.You must write an algorithm that runs in O(log n) time.",
        "examples": [
            {
                "input": "nums = [3,4,5,1,2]",
                "output": "1",
                "explanation": "The original array was [1,2,3,4,5] rotated 3 times",
            },
        ],
        "constraints": [
            "n == nums.length",
            "1 <= n <= 5000",
            "All the integers of nums are unique.",
            "nums is sorted and rotated between 1 and n times.",
            "-5000 <= nums[i] <= 5000",
        ],
        "time_complexity": "O(log n)",
        "space_complexity": "O(1)",
    },

    {
        "id": "bs4",
        "title": "Koko Eating Bananas",
        "slug": "koko-eating-bananas",
        "category": "Heap & Sorting",
        "pattern": "Binary Search",
        "difficulty": "Medium",
        "recognition_minutes": 2,
        "statement": "Koko loves to eat bananas. There are n piles of bananas, the ith pile has piles[i] bananas. The guards have gone and will come back in h hours.Koko can decide her bananas-per-hour eating speed of k. Each hour, she chooses some pile of bananas and eats k bananas from that pile. If the pile has less than k bananas, she eats all of them instead and will not eat any more bananas during this hour.Koko likes to eat slowly but still wants to finish eating all the bananas before the guards return.Return the minimum integer k such that she can eat all the bananas within h hours.",
        "examples": [
            {
                "input": "piles = [3,6,7,11], h = 8",
                "output": "4",
            },
        ],
        "constraints": [
            "1 <= piles.length <= 10^4",
            "piles.length <= h <= 10^9",
        ],
        "time_complexity": "O(nlogm)",
        "space_complexity": "O(1)",
    },
    {
        "id": "l1",
        "title": "Reverse Linked List",
        "slug": "reverse-linked-list",
        "category": "Linked Lists & Stacks",
        "pattern": "Linked List",
        "difficulty": "Easy",
        "recognition_minutes": 1,
        "statement": "Given the head of a singly linked list, reverse the list, and return the reversed list.",
        "examples": [
            {
                "input": "head = [1,2,3,4,5]",
                "output": "[5,4,3,2,1]",
            },
        ],
        "constraints": [
            "The number of nodes in the list is the range [0, 5000].",
            "-5000 <= Node.val <= 5000",
        ],
        "time_complexity": "O(n)",
        "space_complexity": "O(1) (iterative)",
    },

    {
        "id": "l2",
        "title": "Linked List Cycle",
        "slug": "linked-list-cycle",
        "category": "Linked Lists & Stacks",
        "pattern": "Linked List",
        "difficulty": "Easy",
        "recognition_minutes": 1,
        "statement": "Given head, the head of a linked list, determine if the linked list has a cycle in it.There is a cycle in a linked list if there is some node in the list that can be reached again by continuously following the next pointer. Internally, pos is used to denote the index of the node that tail's next pointer is connected to. Note that pos is not passed as a parameter.Return true if there is a cycle in the linked list. Otherwise, return false.",
        "examples": [
            {
                "input": "head = [3,2,0,-4], pos = 1",
                "output": "true",
                "explanation": "There is a cycle in the linked list, where the tail connects to the 1st node (0-indexed).",
            },
        ],
        "constraints": [
            "The number of the nodes in the list is in the range [0, 10^4].",
            "-10^5 <= Node.val <= 10^5",
        ],
        "time_complexity": "O(n)",
        "space_complexity": "O(1)",
    },

    {
        "id": "l3",
        "title": "LRU Cache",
        "slug": "lru-cache",
        "category": "Linked Lists & Stacks",
        "pattern": "Linked List",
        "difficulty": "Medium",
        "recognition_minutes": 2,
        "statement": "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.Implement the LRUCache class:LRUCache(int capacity) Initialize the LRU cache with positive size capacity,int get(int key) Return the value of the key if the key exists, otherwise return -1,void put(int key, int value) Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity from this operation, evict the least recently used key.,The functions get and put must each run in O(1) average time complexity.",
        "examples": [
            {
                "input": "[\"LRUCache\", \"put\", \"put\", \"get\", \"put\", \"get\", \"put\", \"get\", \"get\", \"get\"][[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]",
                "output": "[null, null, null, 1, null, -1, null, -1, 3, 4]",
            },
        ],
        "constraints": [
            "1 <= capacity <= 3000",
            "0 <= key <= 10^4",
            "At most 2 * 10^5 calls will be made to get and put.",
        ],
        "time_complexity": "O(1)",
        "space_complexity": "O(capacity)",
    },

    {
        "id": "tr1",
        "title": "Maximum Depth of Binary Tree",
        "slug": "maximum-depth-of-binary-tree",
        "category": "Trees & Graphs",
        "pattern": "Trees",
        "difficulty": "Easy",
        "recognition_minutes": 1,
        "statement": "Given the root of a binary tree, return its maximum depth.A binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.",
        "examples": [
            {
                "input": "root = [3,9,20,null,null,15,7]",
                "output": "3",
            },
        ],
        "constraints": [
            "The number of nodes in the tree is in the range [0, 10^4].",
            "-100 <= Node.val <= 100",
        ],
        "time_complexity": "O(n)",
        "space_complexity": "O(h) (worset case O(n))",
    },

    {
        "id": "tr2",
        "title": "Validate Binary Search Tree",
        "slug": "validate-binary-search-tree",
        "category": "Trees & Graphs",
        "pattern": "Trees",
        "difficulty": "Medium",
        "recognition_minutes": 2,
        "statement": "Given the root of a binary tree, determine if it is a valid binary search tree (BST).A valid BST is defined as follows:The left subtree of a node contains only nodes with keys strictly less than the node's key,The right subtree of a node contains only nodes with keys strictly greater than the node's key,Both the left and right subtrees must also be binary search trees.",
        "examples": [
            {
                "input": "root = [2,1,3]",
                "output": "true",
            },
        ],
        "constraints": [
            "The number of nodes in the tree is in the range [1, 10^4].",
            "-2^31 <= Node.val <= 2^31 - 1",
        ],
        "time_complexity": "O(n)",
        "space_complexity": "O(h) (worst case O(n))",
    },

    {
        "id": "tr3",
        "title": "Binary Tree Level Order Traversal",
        "slug": "binary-tree-level-order-traversal",
        "category": "Trees & Graphs",
        "pattern": "Trees",
        "difficulty": "Medium",
        "recognition_minutes": 2,
        "statement": "Given the root of a binary tree, return the level order traversal of its nodes' values. (i.e., from left to right, level by level)",
        "examples": [
            {
                "input": "root = [3,9,20,null,null,15,7]",
                "output": "[[3],[9,20],[15,7]]",
            },
        ],
        "constraints": [
            "The number of nodes in the tree is in the range [0, 2000].",
            "-1000 <= Node.val <= 1000",
        ],
        "time_complexity": "O(n)",
        "space_complexity": "O(n)",
    },

    {
        "id": "tr4",
        "title": "Lowest Common Ancestor of a Binary Tree",
        "slug": "lowest-common-ancestor-of-a-binary-tree",
        "category": "Trees & Graphs",
        "pattern": "Trees",
        "difficulty": "Medium",
        "recognition_minutes": 2,
        "statement": "Given a binary tree, find the lowest common ancestor (LCA) of two given nodes in the tree.According to the definition of LCA on Wikipedia: “The lowest common ancestor is defined between two nodes p and q as the lowest node in T that has both p and q as descendants (where we allow a node to be a descendant of itself)",
        "examples": [
            {
                "input": "root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 1",
                "output": "3",
                "explanation": "The LCA of nodes 5 and 1 is 3.",
            },
        ],
        "constraints": [
            "The number of nodes in the tree is in the range [2, 10^5].",
            "-10^9 <= Node.val <= 10^9",
            "All Node.val are unique.",
            "p and q will exist in the tree.",
        ],
        "time_complexity": "O(h) (worset case O(n))",
        "space_complexity": "O(1) (iterative)",
    },

    {
        "id": "tr5",
        "title": "Binary Tree Right Side View",
        "slug": "binary-tree-right-side-view",
        "category": "Trees & Graphs",
        "pattern": "Trees",
        "difficulty": "Medium",
        "recognition_minutes": 2,
        "statement": "Given the root of a binary tree, imagine yourself standing on the right side of it, return the values of the nodes you can see ordered from top to bottom.",
        "examples": [
            {
                "input": "root = [1,2,3,null,5,null,4]",
                "output": "[1,3,4]",
            },
        ],
        "constraints": [
            "The number of nodes in the tree is in the range [2,10^5].",
            "-10^9 <= Node.val <= 10^9",
            "p and q will exist in the tree.",
            "p != q",
        ],
        "time_complexity": "O(n)",
        "space_complexity": "O(n)",
    },

    {
        "id": "g1",
        "title": "Number of Islands",
        "slug": "number-of-islands",
        "category": "Trees & Graphs",
        "pattern": "Graphs",
        "difficulty": "Medium",
        "recognition_minutes": 2,
        "statement": "Given an m x n 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands.An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.",
        "examples": [
            {
                "input": "grid = [[\"1\",\"1\",\"1\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"0\",\"0\"]]",
                "output": "1",
            },
        ],
        "constraints": [
            "m == grid.length",
            "n == grid[i].length",
            "1 <= m, n <= 300",
            "grid[i][j] is '0' or '1'",
        ],
        "time_complexity": "O(m*n)",
        "space_complexity": "O(m*n) worset case(DFS recursion/visited)",
    },

    {
        "id": "g2",
        "title": "Course Schedule",
        "slug": "course-schedule",
        "category": "Trees & Graphs",
        "pattern": "Graphs",
        "difficulty": "Medium",
        "recognition_minutes": 2,
        "statement": "There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. You are given an array prerequisites where prerequisites[i] = [ai, bi] indicates that you must take course bi first if you want to take course ai.For example, the pair [0, 1], indicates that to take course 0 you have to first take course 1.Return true if you can finish all courses. Otherwise, return false.",
        "examples": [
            {
                "input": "numCourses = 2, prerequisites = [[1,0]]",
                "output": "true",
                "explanation": "There are a total of 2 courses to take. To take course 1 you should have finished course 0. So it is possible.",
            },
        ],
        "constraints": [
            "1 <= numCourses <= 2000",
            "0 <= prerequisites.length <= 5000",
            "prerequisites[i].length == 2",
            "0 <= ai, bi < numCourses",
        ],
        "time_complexity": "O(V+E)",
        "space_complexity": "O(V+E)",
    },

    {
        "id": "hp1",
        "title": "Kth Largest Element in an Array",
        "slug": "kth-largest-element-in-an-array",
        "category": "Heap & Sorting",
        "pattern": "Heaps / Priority Queue",
        "difficulty": "Medium",
        "recognition_minutes": 2,
        "statement": "Given an integer array nums and an integer k, return the kth largest element in the array.Note that it is the kth largest element in the sorted order, not the kth distinct element.Can you solve it without sorting?",
        "examples": [
            {
                "input": "nums = [3,2,1,5,6,4], k = 2",
                "output": "5",
            },
        ],
        "constraints": [
            "1 <= k <= nums.length <= 10^5",
            "-10^4 <= nums[i] <= 10^4",
        ],
        "time_complexity": "O(nlogk)(min-heap solution)",
        "space_complexity": "O(k)",
    },

    {
        "id": "hp2",
        "title": "Task Scheduler",
        "slug": "task-scheduler",
        "category": "Heap & Sorting",
        "pattern": "Heaps / Priority Queue",
        "difficulty": "Medium",
        "recognition_minutes": 2,
        "statement": "you are given an array of CPU tasks, each labeled with a letter from A to Z, and a number n. Each CPU interval can be idle or allow the completion of one task. Tasks can be completed in any order, but there's a constraint: there has to be a gap of at least n intervals between two tasks with the same label.Return the minimum number of CPU intervals required to complete all tasks",
        "examples": [
            {
                "input": "tasks = [\"A\",\"A\",\"A\",\"B\",\"B\",\"B\"], n = 2",
                "output": "8",
                "explanation": "A possible sequence is: A -> B -> idle -> A -> B -> idle -> A -> B.After completing task A, you must wait two intervals before doing A again. The same applies to task B. In the 3rd interval, neither A nor B can be done, so you idle. By the 4th interval, you can do A again as 2 intervals have passed.",
            },
        ],
        "constraints": [
            "1 <= tasks.length <= 10^4",
            "tasks[i] is an uppercase English letter",
            "0 <= n <= 100",
        ],
        "time_complexity": "O(n)",
        "space_complexity": "O(1)(26 uppercase letters)",
    },
]