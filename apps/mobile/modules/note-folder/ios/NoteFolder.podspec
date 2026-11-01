Pod::Spec.new do |s|
  s.name           = 'NoteFolder'
  s.version        = '1.0.0'
  s.summary        = 'Keeps access to one folder the person picked, and writes Markdown notes into it.'
  s.description    = 'Daybook journal notes: a security-scoped bookmark and coordinated file access.'
  s.author         = 'Daybook'
  s.homepage       = 'https://daybook.invalid'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.{h,m,mm,swift}'
end
