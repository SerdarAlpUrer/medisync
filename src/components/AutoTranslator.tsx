'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from '@/components/ThemeProvider'
import { translateText } from '@/lib/i18n/masterDictionary'

// Storage for original text and attributes to allow clean roundtrip reverting
const originalTextMap = new WeakMap<Node, string>()
const originalAttrMap = new WeakMap<Element, Record<string, string>>()

export function AutoTranslator() {
    const { language } = useTheme()
    const isTranslatingRef = useRef(false)
    const observerRef = useRef<MutationObserver | null>(null)
    const rafIdRef = useRef<number | null>(null)

    useEffect(() => {
        if (typeof window === 'undefined') return

        const ignoreTags = new Set([
            'SCRIPT', 'STYLE', 'CODE', 'PRE', 'NOSCRIPT', 'SVG', 'PATH', 'IFRAME'
        ])

        const shouldIgnore = (node: Node): boolean => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as Element
                if (ignoreTags.has(el.tagName)) return true
                if (el.hasAttribute('data-no-translate')) return true
            }
            if (node.parentElement) {
                if (ignoreTags.has(node.parentElement.tagName)) return true
                if (node.parentElement.hasAttribute('data-no-translate')) return true
            }
            return false
        }

        // Apply translation to a single text node
        const translateNode = (textNode: Node) => {
            if (shouldIgnore(textNode)) return
            const currentVal = textNode.nodeValue || ''
            if (!currentVal.trim() || currentVal.length < 2) return

            // Remember original Turkish if not already saved
            if (!originalTextMap.has(textNode)) {
                originalTextMap.set(textNode, currentVal)
            }

            const original = originalTextMap.get(textNode) || currentVal
            const translated = translateText(original, 'en')

            if (translated !== currentVal) {
                textNode.nodeValue = translated
            }
        }

        // Revert text node to original Turkish
        const revertNode = (textNode: Node) => {
            if (originalTextMap.has(textNode)) {
                const original = originalTextMap.get(textNode)
                if (original && textNode.nodeValue !== original) {
                    textNode.nodeValue = original
                }
            }
        }

        // Apply translation to element attributes
        const translateAttributes = (el: Element) => {
            if (shouldIgnore(el)) return
            const attrs = ['placeholder', 'title', 'aria-label', 'alt']

            if (el.tagName === 'OPTGROUP' || el.tagName === 'OPTION') {
                attrs.push('label')
            }
            if (el.tagName === 'INPUT') {
                const inputType = (el.getAttribute('type') || '').toLowerCase()
                if (['button', 'submit', 'reset'].includes(inputType)) {
                    attrs.push('value')
                }
            }

            let savedAttrs = originalAttrMap.get(el)
            if (!savedAttrs) {
                savedAttrs = {}
                originalAttrMap.set(el, savedAttrs)
            }

            for (const attr of attrs) {
                const val = el.getAttribute(attr)
                if (val && val.trim()) {
                    if (savedAttrs[attr] === undefined) {
                        savedAttrs[attr] = val
                    }
                    const orig = savedAttrs[attr]
                    const trans = translateText(orig, 'en')
                    if (trans !== val) {
                        el.setAttribute(attr, trans)
                    }
                }
            }
        }

        // Revert element attributes to original Turkish
        const revertAttributes = (el: Element) => {
            const savedAttrs = originalAttrMap.get(el)
            if (savedAttrs) {
                for (const [attr, orig] of Object.entries(savedAttrs)) {
                    if (el.getAttribute(attr) !== orig) {
                        el.setAttribute(attr, orig)
                    }
                }
            }
        }

        // Recursive tree walker
        const walkTree = (root: Node, action: (n: Node) => void, attrAction?: (e: Element) => void) => {
            if (shouldIgnore(root)) return

            if (root.nodeType === Node.TEXT_NODE) {
                action(root)
                return
            }

            if (root.nodeType === Node.ELEMENT_NODE) {
                if (attrAction) attrAction(root as Element)
            }

            let child = root.firstChild
            while (child) {
                walkTree(child, action, attrAction)
                child = child.nextSibling
            }
        }

        const runFullTranslation = () => {
            if (isTranslatingRef.current) return
            isTranslatingRef.current = true

            try {
                if (language === 'en') {
                    walkTree(document.body, translateNode, translateAttributes)
                } else {
                    walkTree(document.body, revertNode, revertAttributes)
                }
            } catch (err) {
                console.error('[AutoTranslator] error during translation walk:', err)
            } finally {
                isTranslatingRef.current = false
            }
        }

        // Initial sweep
        runFullTranslation()

        // Set up reactive observer for newly rendered elements / modals / dynamic tables
        if (language === 'en') {
            const observer = new MutationObserver((mutations) => {
                if (isTranslatingRef.current) return

                if (rafIdRef.current) {
                    cancelAnimationFrame(rafIdRef.current)
                }

                rafIdRef.current = requestAnimationFrame(() => {
                    if (isTranslatingRef.current) return
                    isTranslatingRef.current = true

                    try {
                        for (const m of mutations) {
                            if (m.type === 'characterData' && m.target) {
                                translateNode(m.target)
                            } else if (m.type === 'childList') {
                                m.addedNodes.forEach((node) => {
                                    walkTree(node, translateNode, translateAttributes)
                                })
                            } else if (m.type === 'attributes' && m.target && m.target.nodeType === Node.ELEMENT_NODE) {
                                translateAttributes(m.target as Element)
                            }
                        }
                    } finally {
                        isTranslatingRef.current = false
                    }
                })
            })

            observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true,
                attributeFilter: ['placeholder', 'title', 'aria-label', 'alt', 'label', 'value']
            })

            observerRef.current = observer
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect()
                observerRef.current = null
            }
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current)
                rafIdRef.current = null
            }
        }
    }, [language])

    return null
}
