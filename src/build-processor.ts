import type { AstroConfig, AstroIntegrationLogger } from 'astro'
import fs from 'node:fs/promises'
import path from 'node:path'
import { htmlToMarkdown } from './html-to-markdown'
import { generateLlmMarkdown } from './llm-endpoint'
import { generateLlmsTxt } from './llms-txt-endpoint'
import { createStaticOutput, generateMarkdown } from './markdown-generator'
import { getBaseUrl, getHtmlPath, getLlmOutputPath, getLlmsTxtOutputPath, getMdOutputPath, injectMarkdownLink, normalizePath } from './paths'
import type { PageEntry, ResolvedOptions, SiteMetadata } from './types'

interface PageInfo {
	pathname: string
}

/**
 * Process build output and generate .md files for all pages
 */
export async function processBuildOutput(
	dir: URL,
	pages: PageInfo[],
	options: ResolvedOptions,
	logger: AstroIntegrationLogger,
	config: AstroConfig,
) {
	const baseUrl = getBaseUrl(config)
	const distDir = dir.pathname
	const pageEntries: PageEntry[] = []
	let siteMetadata: SiteMetadata = {}

	for (const page of pages) {
		const pagePath = normalizePath(page.pathname === '' ? '/' : `/${page.pathname}`)

		try {
			if (!options.includeStaticPages) continue

			const mdPath = getMdOutputPath(distDir, pagePath)
			const htmlPath = getHtmlPath(distDir, pagePath)

			let html: string
			try {
				html = await fs.readFile(htmlPath, 'utf-8')
			} catch {
				continue
			}
			const { metadata, body } = htmlToMarkdown(html)
			const output = createStaticOutput(metadata, body)

			const markdown = generateMarkdown(output, {
				url: pagePath,
				baseUrl,
			}, options.includeFrontmatter)

			await writeMarkdownFile(mdPath, markdown)
			await injectLinkIntoHtml(htmlPath, pagePath)
			pageEntries.push({
				pathname: pagePath,
				title: metadata.title,
			})

			// Extract site metadata from homepage
			if (pagePath === '/') {
				siteMetadata = {
					title: metadata.title,
					description: metadata.description,
				}
			}

		} catch (error) {
			logger.warn(`Failed to process ${pagePath}: ${error}`)
		}
	}

	if (pageEntries.length > 0) {
		logger.info(`Generated ${pageEntries.length} .md files`)
	}

	// Generate llm.md if enabled
	if (options.llmEndpoint !== false) {
		if (!baseUrl) {
			logger.warn('Skipping /.well-known/llm.md generation: no `site` configured in astro.config')
		} else {
			try {
				const llmContent = generateLlmMarkdown(pageEntries, { ...siteMetadata, baseUrl }, options.llmEndpoint)
				const llmPath = getLlmOutputPath(distDir)
				await writeMarkdownFile(llmPath, llmContent)
				logger.info('Generated /.well-known/llm.md')
			} catch (error) {
				logger.warn(`Failed to generate llm.md: ${error}`)
			}
		}
	}

	// Generate llms.txt if enabled
	if (options.llmsTxt !== false) {
		if (!baseUrl) {
			logger.warn('Skipping /llms.txt generation: no `site` configured in astro.config')
		} else {
			try {
				const llmsTxtContent = generateLlmsTxt(pageEntries, { ...siteMetadata, baseUrl }, options.llmsTxt)
				const llmsTxtPath = getLlmsTxtOutputPath(distDir)
				await writeMarkdownFile(llmsTxtPath, llmsTxtContent)
				logger.info('Generated /llms.txt')
			} catch (error) {
				logger.warn(`Failed to generate llms.txt: ${error}`)
			}
		}
	}
}

async function injectLinkIntoHtml(htmlPath: string, pagePath: string): Promise<void> {
	try {
		const html = await fs.readFile(htmlPath, 'utf-8')
		await fs.writeFile(htmlPath, injectMarkdownLink(html, pagePath), 'utf-8')
	} catch {
		// File might not exist for some pages
	}
}

async function writeMarkdownFile(filePath: string, content: string): Promise<void> {
	await fs.mkdir(path.dirname(filePath), { recursive: true })
	await fs.writeFile(filePath, content, 'utf-8')
}
