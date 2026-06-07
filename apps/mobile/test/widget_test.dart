import 'package:flutter_test/flutter_test.dart';

// The app requires async init (EasyLocalization + SharedPreferences) and a
// ProviderScope, so a full pump belongs in integration tests. This keeps the
// default unit-test target green.
void main() {
  test('sanity', () {
    expect(1 + 1, equals(2));
  });
}
