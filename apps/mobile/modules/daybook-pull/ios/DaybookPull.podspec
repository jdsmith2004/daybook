Pod::Spec.new do |s|
  s.name           = 'DaybookPull'
  s.version        = '1.0.0'
  s.summary        = 'The app that pulls you in: Apple Screen Time access, Apple\'s app list, the watching and the pause.'
  s.description    = 'Daybook Screen Time: FamilyControls, DeviceActivity and ManagedSettings, on this phone only.'
  s.author         = 'Daybook'
  s.homepage       = 'https://daybook.invalid'
  s.platforms      = { :ios => '16.0' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.weak_frameworks = 'FamilyControls', 'DeviceActivity', 'ManagedSettings'
  s.source_files = '**/*.{h,m,mm,swift}'
end
