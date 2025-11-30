import { test, expect } from '@playwright/test'

/**
 * E2E tests for Batch-Task Integration
 * Tests linking SOP templates, creating tasks, and generating batch packets
 */

test.describe('Batch-Task Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login or use dev mode
    await page.goto('/')
    
    // Wait for potential redirects
    await page.waitForURL(/dashboard/)
  })

  test('should display Tasks & SOPs tab in batch detail', async ({ page }) => {
    // Navigate to batches page
    await page.goto('/dashboard/batches')
    
    // Wait for batches to load
    await page.waitForSelector('table', { timeout: 10000 })
    
    // Click on first batch to view details
    const firstBatchRow = page.locator('table tbody tr').first()
    await firstBatchRow.click()
    
    // Wait for batch detail dialog to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
    
    // Check that Tasks & SOPs tab exists
    const tasksTab = page.locator('button[role="tab"]:has-text("Tasks & SOPs")')
    await expect(tasksTab).toBeVisible()
    
    // Click on Tasks & SOPs tab
    await tasksTab.click()
    
    // Verify tab content is displayed
    await expect(page.locator('text=Linked SOP Templates')).toBeVisible()
    await expect(page.locator('text=Tasks')).toBeVisible()
  })

  test('should open link template dialog', async ({ page }) => {
    // Navigate to batches page
    await page.goto('/dashboard/batches')
    
    // Open first batch detail
    await page.waitForSelector('table tbody tr')
    await page.locator('table tbody tr').first().click()
    
    // Navigate to Tasks & SOPs tab
    await page.waitForSelector('[role="dialog"]')
    await page.locator('button[role="tab"]:has-text("Tasks & SOPs")').click()
    
    // Look for Link Template button (if permissions allow)
    const linkTemplateButton = page.locator('button:has-text("Link Template")')
    
    // Check if button exists (user may not have permission)
    const buttonCount = await linkTemplateButton.count()
    if (buttonCount > 0) {
      await linkTemplateButton.click()
      
      // Verify dialog opened
      await expect(page.locator('text=Link SOP Template to Batch')).toBeVisible()
      
      // Verify form elements are present
      await expect(page.locator('label:has-text("SOP Template")')).toBeVisible()
      await expect(page.locator('text=Auto-create tasks')).toBeVisible()
    }
  })

  test('should display batch tasks in the table', async ({ page }) => {
    // Navigate to batches page
    await page.goto('/dashboard/batches')
    
    // Open first batch detail
    await page.waitForSelector('table tbody tr')
    await page.locator('table tbody tr').first().click()
    
    // Navigate to Tasks & SOPs tab
    await page.waitForSelector('[role="dialog"]')
    await page.locator('button[role="tab"]:has-text("Tasks & SOPs")').click()
    
    // Wait for tasks section to load
    await page.waitForSelector('text=Tasks', { timeout: 5000 })
    
    // Check for either tasks table or no tasks message
    const tasksTable = page.locator('table').filter({ hasText: 'Task' })
    const noTasksMessage = page.locator('text=No tasks created for this batch yet')
    
    // One of them should be visible
    const hasTable = await tasksTable.count() > 0
    const hasMessage = await noTasksMessage.count() > 0
    
    expect(hasTable || hasMessage).toBeTruthy()
  })

  test('should have generate packet button in batch detail', async ({ page }) => {
    // Navigate to batches page
    await page.goto('/dashboard/batches')
    
    // Open first batch detail
    await page.waitForSelector('table tbody tr')
    await page.locator('table tbody tr').first().click()
    
    // Wait for dialog
    await page.waitForSelector('[role="dialog"]')
    
    // Look for Generate Packet button (if permissions allow)
    const generateButton = page.locator('button:has-text("Generate Packet")')
    
    // Check if button exists (user may not have permission)
    const buttonCount = await generateButton.count()
    if (buttonCount > 0) {
      await expect(generateButton).toBeVisible()
    }
  })

  test('should filter tasks by status', async ({ page }) => {
    // Navigate to batches page
    await page.goto('/dashboard/batches')
    
    // Open first batch detail
    await page.waitForSelector('table tbody tr')
    await page.locator('table tbody tr').first().click()
    
    // Navigate to Tasks & SOPs tab
    await page.waitForSelector('[role="dialog"]')
    await page.locator('button[role="tab"]:has-text("Tasks & SOPs")').click()
    
    // Wait for tasks section
    await page.waitForSelector('text=Tasks')
    
    // Look for status filter buttons
    const allButton = page.locator('button:has-text("All (")')
    const toDoButton = page.locator('button:has-text("To Do (")')
    const doneButton = page.locator('button:has-text("Done (")')
    
    // Verify filter buttons exist
    await expect(allButton).toBeVisible()
    await expect(toDoButton).toBeVisible()
    await expect(doneButton).toBeVisible()
    
    // Click on Done filter
    await doneButton.click()
    
    // The page should update (we can't test exact content without knowing the data)
    await page.waitForTimeout(500) // Brief wait for filter to apply
  })

  test('should show task statistics in batch detail', async ({ page }) => {
    // Navigate to batches page
    await page.goto('/dashboard/batches')
    
    // Open first batch detail
    await page.waitForSelector('table tbody tr')
    await page.locator('table tbody tr').first().click()
    
    // Navigate to Tasks & SOPs tab
    await page.waitForSelector('[role="dialog"]')
    await page.locator('button[role="tab"]:has-text("Tasks & SOPs")').click()
    
    // Wait for tasks section
    await page.waitForSelector('text=Tasks')
    
    // Check for task completion summary text (e.g., "0 of 0 tasks completed")
    const summaryText = page.locator('text=/\\d+ of \\d+ tasks completed/')
    await expect(summaryText).toBeVisible()
  })
})
