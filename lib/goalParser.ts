export interface ParsedGoal {
  title: string
  description: string
  category: 'Physical Health' | 'Mental Health' | 'Finance' | 'Social'
  targetDate?: string
  tasks: string[]
}

export interface GoalParseResult {
  goals: ParsedGoal[]
  hasGoals: boolean
  confirmationNeeded: boolean
}

class GoalParser {
  parseAIResponse(response: string): GoalParseResult {
    const result: GoalParseResult = {
      goals: [],
      hasGoals: false,
      confirmationNeeded: false
    }

    // Check if the response contains the structured goal format
    const goalPattern = /🎯\s*\*\*Goal Title\*\*:\s*(.+)/gi
    const descriptionPattern = /📝\s*\*\*Description\*\*:\s*(.+)/gi
    const categoryPattern = /🏷️\s*\*\*Category\*\*:\s*(.+)/gi
    const targetPattern = /📅\s*\*\*Target\*\*:\s*(.+)/gi

    const goalMatches = Array.from(response.matchAll(goalPattern))
    
    if (goalMatches.length === 0) {
      // Check if AI is asking for confirmation to create goals
      const confirmationKeywords = [
        'should i create',
        'create these goals',
        'add these to your app',
        'shall i set up',
        'would you like me to create',
        'does this sound like a good plan'
      ]
      
      result.confirmationNeeded = confirmationKeywords.some(keyword => 
        response.toLowerCase().includes(keyword)
      )
      
      return result
    }

    // Parse each goal
    for (let i = 0; i < goalMatches.length; i++) {
      const title = goalMatches[i][1]?.trim()
      if (!title) continue

      // Find corresponding description, category, target, and tasks
      const description = this.extractField(response, descriptionPattern, i) || title
      const categoryText = this.extractField(response, categoryPattern, i) || 'Physical Health'
      const target = this.extractField(response, targetPattern, i)
      
      // Find the goal block first, then look for tasks after it
      const goalStart = response.indexOf(goalMatches[i][0])
      const nextGoalStart = i + 1 < goalMatches.length ? response.indexOf(goalMatches[i + 1][0]) : response.length
      const goalBlock = response.substring(goalStart, nextGoalStart)
      
      // Look for tasks in multiple possible formats
      let tasksText = ''
      
      // Try multiple task section patterns
      const taskPatterns = [
        /\*\*Tasks?\*\*:\s*\n?([\s\S]*)/i,           // **Tasks:**
        /\*\*Action Steps?\*\*:\s*\n?([\s\S]*)/i,    // **Action Steps:**
        /\*\*Steps?\*\*:\s*\n?([\s\S]*)/i,           // **Steps:**
        /\*\*To achieve this\*\*:\s*\n?([\s\S]*)/i,  // **To achieve this:**
        /Here's what you can do:\s*\n?([\s\S]*)/i,   // Here's what you can do:
        /You should:\s*\n?([\s\S]*)/i,               // You should:
        /Action plan:\s*\n?([\s\S]*)/i,              // Action plan:
      ]
      
      let tasksMatch = null
      for (const pattern of taskPatterns) {
        tasksMatch = goalBlock.match(pattern)
        if (tasksMatch) {
          tasksText = tasksMatch[1].split(/\n\n.*Does this/)[0].trim()
          // Found tasks with this pattern
          break
        }
      }
      
      // If no explicit task section, look for bullet points anywhere in the goal block
      if (!tasksMatch && (goalBlock.includes('-') || goalBlock.includes('•') || goalBlock.includes('*'))) {
        // Extract lines that look like tasks (start with -, •, *, or numbers)
        const lines = goalBlock.split('\n')
        const taskLines = lines.filter(line => {
          const trimmed = line.trim()
          return trimmed.match(/^[-•*]\s+.+/) || trimmed.match(/^\d+\.\s+.+/)
        })
        tasksText = taskLines.join('\n')
      }

      // Parse category
      const category = this.parseCategory(categoryText)

      // Parse tasks from the goal block
      const tasks = this.parseTasks(tasksText)

      const goal: ParsedGoal = {
        title,
        description,
        category,
        tasks
      }

      if (target) {
        goal.targetDate = this.parseTargetDate(target)
      }

      result.goals.push(goal)
    }

    result.hasGoals = result.goals.length > 0
    return result
  }

  private extractField(text: string, pattern: RegExp, index: number = 0): string | null {
    const matches = Array.from(text.matchAll(pattern))
    return matches[index]?.[1]?.trim() || null
  }

  private parseCategory(categoryText: string): ParsedGoal['category'] {
    const normalizedCategory = categoryText.toLowerCase().trim()
    
    // Check more specific categories first to avoid overlap
    if (normalizedCategory.includes('mental') || normalizedCategory.includes('mind') || normalizedCategory.includes('stress')) {
      return 'Mental Health'
    }
    if (normalizedCategory.includes('physical') || normalizedCategory.includes('fitness') || normalizedCategory.includes('exercise')) {
      return 'Physical Health'
    }
    if (normalizedCategory.includes('finance') || normalizedCategory.includes('money') || normalizedCategory.includes('budget')) {
      return 'Finance'
    }
    if (normalizedCategory.includes('social') || normalizedCategory.includes('relationship') || normalizedCategory.includes('network')) {
      return 'Social'
    }
    
    // Generic 'health' without specific qualifier defaults to Physical Health
    if (normalizedCategory.includes('health')) {
      return 'Physical Health'
    }
    
    return 'Physical Health' // Default fallback
  }

  private parseTasks(tasksText: string): string[] {
    if (!tasksText.trim()) {
      return []
    }

    // Parse task list from various formats
    const tasks: string[] = []
    
    // Split by lines and look for task patterns
    const lines = tasksText.split('\n')
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // Skip empty lines
      if (!trimmedLine) continue
      
      // Match various task list formats:
      // - Task name
      // • Task name  
      // * Task name
      // 1. Task name
      // - [ ] Task name
      const taskPatterns = [
        /^[-•*]\s+(.+)$/,           // - Task, • Task, * Task
        /^\d+\.\s+(.+)$/,          // 1. Task, 2. Task
        /^[-*]\s+\[\s*\]\s+(.+)$/  // - [ ] Task, * [ ] Task
      ]
      
      let taskFound = false
      for (const pattern of taskPatterns) {
        const match = trimmedLine.match(pattern)
        if (match && match[1]) {
          const taskTitle = match[1].trim()
          
          // Filter out non-task content
          if (taskTitle.length > 0 && 
              !taskTitle.toLowerCase().includes('does this') &&
              !taskTitle.toLowerCase().includes('sound good') &&
              !taskTitle.toLowerCase().includes('what do you think') &&
              taskTitle.length < 100) { // Reasonable task title length
            tasks.push(taskTitle)
            taskFound = true
            break
          }
        }
      }
      
      // If no pattern matched but it looks like a task, add it
      if (!taskFound && trimmedLine.length > 3 && trimmedLine.length < 100) {
        // Check if it's likely a task (not a question or long description)
        if (!trimmedLine.includes('?') && !trimmedLine.toLowerCase().includes('does this')) {
          tasks.push(trimmedLine)
        }
      }
    }
    
    return tasks
  }

  private parseTargetDate(targetText: string): string {
    // Simple date parsing - could be enhanced
    const now = new Date()
    const lowerTarget = targetText.toLowerCase()
    
    if (lowerTarget.includes('week')) {
      const weeks = this.extractNumber(lowerTarget) || 1
      const targetDate = new Date(now.getTime() + weeks * 7 * 24 * 60 * 60 * 1000)
      return targetDate.toISOString().split('T')[0]
    }
    
    if (lowerTarget.includes('month')) {
      const months = this.extractNumber(lowerTarget) || 1
      const targetDate = new Date(now.getFullYear(), now.getMonth() + months, now.getDate())
      return targetDate.toISOString().split('T')[0]
    }
    
    if (lowerTarget.includes('year')) {
      const years = this.extractNumber(lowerTarget) || 1
      const targetDate = new Date(now.getFullYear() + years, now.getMonth(), now.getDate())
      return targetDate.toISOString().split('T')[0]
    }
    
    // Try to extract a specific date if mentioned
    const dateMatch = targetText.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/)
    if (dateMatch) {
      return new Date(dateMatch[1]).toISOString().split('T')[0]
    }
    
    // Default to 3 months if no specific time mentioned
    const defaultTarget = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate())
    return defaultTarget.toISOString().split('T')[0]
  }

  private extractNumber(text: string): number | null {
    const match = text.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : null
  }

  // Generate smart defaults for task scheduling
  generateTaskDefaults(tasks: string[], goalCategory: string) {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    return tasks.map((taskTitle, index) => {
      const defaultTime = this.getSmartTimeForTask(taskTitle, index)
      const priority = this.getTaskPriority(taskTitle)
      
      return {
        title: taskTitle,
        description: `Task for ${goalCategory.toLowerCase()} goal`,
        schedule_date: todayStr,
        schedule_time: defaultTime,
        priority: priority,
        category: goalCategory
      }
    })
  }

  private getSmartTimeForTask(taskTitle: string, index: number): string {
    const lowerTitle = taskTitle.toLowerCase()
    
    // Time-specific keywords
    if (lowerTitle.includes('morning') || lowerTitle.includes('breakfast') || lowerTitle.includes('wake')) {
      return '07:00'
    }
    if (lowerTitle.includes('lunch') || lowerTitle.includes('noon') || lowerTitle.includes('midday')) {
      return '12:00'
    }
    if (lowerTitle.includes('evening') || lowerTitle.includes('dinner') || lowerTitle.includes('night')) {
      return '18:00'
    }
    if (lowerTitle.includes('afternoon')) {
      return '15:00'
    }
    
    // Activity-specific defaults
    if (lowerTitle.includes('gym') || lowerTitle.includes('workout') || lowerTitle.includes('exercise')) {
      return '07:00' // Morning workout
    }
    if (lowerTitle.includes('meal prep') || lowerTitle.includes('cooking') || lowerTitle.includes('prep')) {
      return '18:00' // Evening prep
    }
    if (lowerTitle.includes('water') || lowerTitle.includes('drink') || lowerTitle.includes('hydrate')) {
      return '09:00' // Start hydration early
    }
    if (lowerTitle.includes('meditation') || lowerTitle.includes('mindfulness') || lowerTitle.includes('relax')) {
      return '08:00' // Morning meditation
    }
    if (lowerTitle.includes('read') || lowerTitle.includes('study') || lowerTitle.includes('learn')) {
      return '20:00' // Evening reading
    }
    
    // Default spacing: spread tasks throughout the day
    const baseHours = [9, 12, 15, 18, 20] // 9 AM, 12 PM, 3 PM, 6 PM, 8 PM
    const hour = baseHours[index % baseHours.length]
    return `${hour.toString().padStart(2, '0')}:00`
  }

  private getTaskPriority(taskTitle: string): 'high' | 'medium' | 'low' {
    const lowerTitle = taskTitle.toLowerCase()
    
    // High priority keywords
    if (lowerTitle.includes('urgent') || lowerTitle.includes('important') || 
        lowerTitle.includes('deadline') || lowerTitle.includes('critical') ||
        lowerTitle.includes('must') || lowerTitle.includes('emergency')) {
      return 'high'
    }
    
    // Low priority keywords  
    if (lowerTitle.includes('optional') || lowerTitle.includes('when possible') ||
        lowerTitle.includes('if time') || lowerTitle.includes('eventually') ||
        lowerTitle.includes('try to') || lowerTitle.includes('consider')) {
      return 'low'
    }
    
    // Default to medium
    return 'medium'
  }
}

export const goalParser = new GoalParser()