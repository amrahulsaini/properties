import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../services/api.dart';
import '../theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _pass = TextEditingController();
  bool _loading = false, _showPass = false;

  Future<void> _login() async {
    if (_email.text.trim().isEmpty || _pass.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter email and password.')),
      );
      return;
    }
    setState(() => _loading = true);
    try {
      await login(_email.text.trim().toLowerCase(), _pass.text);
      if (mounted) Navigator.pushReplacementNamed(context, '/home');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(height: 32),
                // Logo
                Image.asset('assets/samarth-logo.webp', height: 72, fit: BoxFit.contain),
                const SizedBox(height: 40),
                // Card
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: kCardDecoration,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Welcome back',
                          style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: kInk)),
                      const SizedBox(height: 4),
                      const Text('Sign in to your account',
                          style: TextStyle(fontSize: 14, color: kMuted)),
                      const SizedBox(height: 24),
                      // Email
                      const Text('Email address',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: kInk)),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _email,
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                        autocorrect: false,
                        decoration: const InputDecoration(
                          hintText: 'you@company.com',
                          prefixIcon: Icon(LucideIcons.mail, size: 18, color: kMuted),
                        ),
                      ),
                      const SizedBox(height: 16),
                      // Password
                      const Text('Password',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: kInk)),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _pass,
                        obscureText: !_showPass,
                        textInputAction: TextInputAction.done,
                        onSubmitted: (_) => _login(),
                        decoration: InputDecoration(
                          hintText: '••••••••',
                          prefixIcon: const Icon(LucideIcons.lock, size: 18, color: kMuted),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _showPass ? LucideIcons.eyeOff : LucideIcons.eye,
                              size: 18, color: kMuted,
                            ),
                            onPressed: () => setState(() => _showPass = !_showPass),
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      // Button
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _loading ? null : _login,
                          child: _loading
                              ? const SizedBox(
                                  height: 18, width: 18,
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                )
                              : const Text('Sign In'),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),
                const Text('Samarth Realty · v1.0',
                    style: TextStyle(fontSize: 12, color: kMuted)),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
