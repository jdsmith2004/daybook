Pod::Spec.new do |s|
  s.name           = 'WidgetCheck'
  s.version        = '1.0.0'
  s.summary        = 'Says whether the flame widget is on the Home Screen or the Lock Screen.'
  s.description    = 'Daybook: reads WidgetKit current configurations, so putting the flame on a screen can earn its points.'
  s.author         = 'Daybook'
  s.homepage       = 'https://daybook.invalid'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.{h,m,mm,swift}'
end
