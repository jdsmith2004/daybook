Pod::Spec.new do |s|
  s.name           = 'ScriptureVault'
  s.version        = '1.0.0'
  s.summary        = 'Reads the scripture library in an Obsidian vault the person picked, and writes verse notes into it.'
  s.description    = 'Daybook scripture library: a security-scoped bookmark and coordinated, compare-before-write file access.'
  s.author         = 'Daybook'
  s.homepage       = 'https://daybook.invalid'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.{h,m,mm,swift}'
end
