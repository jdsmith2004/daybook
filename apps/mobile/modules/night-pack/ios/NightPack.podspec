Pod::Spec.new do |s|
  s.name           = 'NightPack'
  s.version        = '1.0.0'
  s.summary        = 'The night pack: what the Shortcuts actions read, and what they leave.'
  s.description    = 'Daybook night pack: tonight start, the open window, and when each action last ran, in UserDefaults.'
  s.author         = 'Daybook'
  s.homepage       = 'https://daybook.invalid'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.{h,m,mm,swift}'
end
