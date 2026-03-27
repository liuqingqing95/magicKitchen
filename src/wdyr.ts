
if (import.meta.env.MODE === 'development') {
  // 先导入 React
  const React = await import('react')
  // 再导入 WDYR
  const wdyr = await import('@welldone-software/why-did-you-render')
  const whyDidYouRender = wdyr.default
  
  whyDidYouRender(React.default, {
    trackAllPureComponents: true,
    logOnDifferentValues: true,
    collapseGroups: false,
    trackHooks: true,
    trackExtraHooks: [
      [React, 'useMemo'],
      [React, 'useCallback'],
      [React, 'useEffect'],
    ],
  })
  
  console.log('✅ Why Did You Render 已启用')
}