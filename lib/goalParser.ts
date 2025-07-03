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
      
      // Look for **Tasks:** in this goal block
      let tasksText = ''
      const tasksMatch = goalBlock.match(/\*\*Tasks?\*\*:\s*\n?([\s\S]*)/i)
      if (tasksMatch) {
        // Remove the "Does this capture" part if it exists
        tasksText = tasksMatch[1].split(/\n\n.*Does this/)[0].trim()
      }

      // Parse category
      const category = this.parseCategory(categoryText)

      // Parse tasks - for now, return empty array since we're focusing on goals
      const tasks: string[] = []

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
    
    if (normalizedCategory.includes('physical') || normalizedCategory.includes('health') || normalizedCategory.includes('fitness')) {
      return 'Physical Health'
    }
    if (normalizedCategory.includes('mental') || normalizedCategory.includes('mind') || normalizedCategory.includes('stress')) {
      return 'Mental Health'
    }
    if (normalizedCategory.includes('finance') || normalizedCategory.includes('money') || normalizedCategory.includes('budget')) {
      return 'Finance'
    }
    if (normalizedCategory.includes('social') || normalizedCategory.includes('relationship') || normalizedCategory.includes('network')) {
      return 'Social'
    }
    
    return 'Physical Health' // Default fallback
  }

  private parseTasks(tasksText: string): string[] {
    // For now, returning empty array to focus on goals
    return []
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
}

export const goalParser = new GoalParser()

// Test function to debug parsing
export const testGoalParsing = (response: string) => {
  console.log('🧪 Testing goal parsing...')
  console.log('Input:', response)
  
  const result = goalParser.parseAIResponse(response)
  console.log('Result:', result)
  
  result.goals.forEach((goal, index) => {
    console.log(`Goal ${index + 1}:`, {
      title: goal.title,
      description: goal.description,
      category: goal.category,
      tasks: goal.tasks,
      taskCount: goal.tasks.length
    })
  })
  
  return result
}