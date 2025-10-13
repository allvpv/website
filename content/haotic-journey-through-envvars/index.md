+++
date = 'Mon, 13 Oct 2025 15:00:00 +0200'
draft = false
title = "Environment variables are a legacy mess: Let's dive deep into them"
toc = false
images = ['pattern-rendered.png']
+++

{{<pattern-graphics>}}

Programming languages have rapidly evolved in recent years. But in software
development, the new often meets the old, and the scaffolding that OS gives for
running new processes hasn’t changed much since Unix.

If you need to parametrize your application at runtime by passing a few ad-hoc
variables (without special files or a custom solution involving IPC or
networking), you're doomed to a pretty awkward, outdated interface:

## Environment variables.

`export SECRET_API_KEY=2u845102348u234`

There are no namespaces for them, no types. Just a flat, embarrassingly global
dictionary of strings.

But what exactly are these envvars? Is it some kind of special dictionary
inside the OS? If not, who owns them and how do they propagate?


## Where do they come from?

In a nutshell: they're passed from parent to child.

```
    841 ?        00:00:00 sshd
   1520 ?        00:00:00  \_ sshd-session
   1616 ?        00:00:00      \_ sshd-session
   5521 pts/0    00:00:00          \_ bash
   5545 pts/0    00:00:00              \_ nu
   5549 pts/0    00:00:00                  \_ bash
   5560 pts/0    00:00:00                      \_ ps
```

On Linux, a program must use the `execve` syscall to execute another program.
Whether you type `ls` in Bash, call `subprocess.run` in Python, or launch a
code editor, it ultimately comes down to `execve`, preceded by a
`clone`/`fork`. The `exec*` family of C functions also relies on `execve`.

```c
SYSCALL_DEFINE3(execve,
		const char __user *, filename,
		const char __user *const __user *, argv,
		const char __user *const __user *, envp)
```

This system call takes three arguments: `filename`, `argv`, `envp`.
For example, for an `ls -lah` invocation:
1. `/usr/bin/ls` is the `filename` (the executable path),
2. `['ls', '-lah']` is the `argv` array of command line arguments – the
   implicit first ("zero") argument is usually the executable name,
3. `['PATH=/bin:/usr/bin', 'USER=allvpv']` is the `envp` array of envvars
   (typically much longer).

By default, all envvars are passed from the parent to the child. However,
nothing prevents a parent process from passing a completely different or even
empty environment when calling `execve`! In practice, most tooling passes the
environment down: Bash, Python’s `subprocess.run`, the C library `execl`, and
so on.

And this is what you expect – variables are inherited by child processes.
That’s the point – to track the environment.

> Which tools do *not* pass the parent's environment?
> For example, the `login` executable, used when signing into a
> system, sets up a fresh environment for its children.


## Where do they go?

After launching the new program, the kernel dumps the variables on the stack as
a sequence of null-terminated strings which contain the envvar definitions.
Here is a hex view:

```
    484f 4d45 3d2f 0069 6e69 743d 2f73 6269  HOME=/ init=/sbi
    6e2f 696e 6974 004e 4554 574f 524b 5f53  n/init NETWORK_S
    4b49 505f 454e 534c 4156 4544 3d00 5445  KIP_ENSLAVED= TE
    524d 3d6c 696e 7578 0042 4f4f 545f 494d  RM=linux BOOT_IM
    4147 453d 2f76 6d6c 696e 757a 2d36 2e31  AGE=/vmlinuz-6.1
    342e 302d 3333 2d67 656e 6572 6963 0064  4.0-33-generic.d
    726f 705f 6361 7073 3d00 5041 5448 3d2f  rop_caps= PATH=/
    7573 722f 6c6f 6361 6c2f 7362 696e 3a2f  usr/local/sbin:/
    7573 722f 6c6f 6361 6c2f 6269 6e3a 2f75  usr/local/bin:/u
    7372 2f73 6269 6e3a 2f75 7372 2f62 696e  sr/sbin:/usr/bin
    3a2f 7362 696e 3a2f 6269 6e00 5057 443d  :/sbin:/bin PWD=
    2f00 726f 6f74 6d6e 743d 2f72 6f6f 7400  / rootmnt=/root
```

This static layout can’t easily be modified or extended; the program must copy
those variables into its own data structure. Let’s look at how Bash, C, and
Python store envvars internally. I analyzed their source code and here is a
summary.

### Bash

It stores the variables in a ***hashmap***. Or, more precisely, in a ***stack
of hashmaps***.

When you spawn a new process using Bash, it traverses the stack of hashmaps to
find variables marked as exported and copies them into the environment array
passed to the child.

> *Side note:* Why is traversing the stack needed?
>
>  Each function invocation in Bash creates a new local scope – a new entry
>  on the stack. If you declare your variable with `local`, it ends up in this
>  locally-scoped hashmap.
>
> What's interesting is that you can export a `local` variable too!
>
> ```bash
> function locallyScoped() {
>     local PATH="$PATH:/opt/secret/bin"
>     export PATH
>     env           # <- sees the PATH with /opt/scecret/bin
> }
>
>
> locallyScoped
> env               # <- sees the PATH without modification
> ```
>
> I wouldn't have learned this without diving into Bash source. My intuitive
> (wrong) assumption was that `export` *automatically makes the variable
> global* – like `declare -g`! Super interesting stuff.

### The default C library on Linux: `glibc`

`glibc` exposes a dynamic `environ` array, managed via `putenv` and `getenv`
library functions. It uses an array, so the time complexity of `getenv` and
`putenv` is *linear* in the number of envvars. Remember – envvars are not a
high-performance dictionary and you should not abuse them.

### Python

Python couples its environment to the C library, which can cause surprising
inconsistencies.

If you've programmed some Python, you've probably used the `os.environ`
dictionary. On startup, `os.environ` is built from the C library's `environ`
array.

But those dictionary values are **NOT** the “ground truth” for child processes.
Rather, each change to `os.environ` invokes the native `os.putenv` function,
which in turn calls the C library's `putenv`.

> Note that the propagation is one-directional: modifying `os.environ` will call
> `os.putenv`, but not the other way around. Call `os.putenv`, and `os.environ`
> won't be updated.




## Liberal format

The Linux kernel is very liberal about the format of environment variables, and
so is `glibc`.

For example, your C program can manipulate the environment – the global
`environ` array – such that several variables share the same name but have
different values. And when you execute a child process, it will inherit this
“broken” setup.

You don't even need an equals sign separating name from value! The usual entry
is `NAME=VALUE`, but nothing prevents you from adding `NONSENSE_WITH_EMOJI 😀`
to the array.

The kernel happily accepts any null-terminated string as an “environment
variable” definition. It just imposes a *size* limitation:

- **Single variable**: 128 KiB on a typical x64 Intel CPU. This is for the
  whole definition – name + equal sign + value. It's computed as [`PAGE_SIZE *
  32`](https://elixir.bootlin.com/linux/v2.6.24/source/include/linux/binfmts.h#L14).
  No modern hardware uses pages smaller than 4 KiB, so you can treat it as a
  lower bound, unless you need to deal with some legacy embedded systems.

- **Total**: 2 MiB on a typical machine. This limit is shared by envvars and
  the command line arguments. The calculation is a bit more complicated (see
  the `execve(2)` man page):

        max(32 * PAGE_SIZE,  min(MAX_STACK_SIZE / 4,  6 MB))

  On a typical system, the limiting factor is the `MAX_STACK_SIZE`. Remember,
  initially the envvars are dumped on the stack! To prevent unpredictable
  crashes, the system allows only 1/4 of the stack for the envvars.


## Quirks

But the fact that you can do something does not mean that you should. For
example, if you start Bash with the "broken" environment – duplicated names and
entries without `=` – it deduplicates the variables and drops the nonsense.

One interesting edge case is a space inside the variable *name*. My beloved
shell – [Nushell](https://www.nushell.sh/) – has no problem with the following
assignment:

    $env."Deployment Environment" = "prod"

Python is fine with it, too. Bash, on the other hand, can’t reference it
because whitespace isn’t allowed in variable names. Fortunately, the variable
isn’t lost – [Bash keeps such entries in a special hashmap
called](https://github.com/bminor/bash/blob/a8a1c2fac029404d3f42cd39f5a20f24b6e4fe4b/variables.c#L126)
`invalid_env` and still passes them to child processes.

## The standard format

So what name and value can you *safely* use for your envvar? A popular
misconception, repeated on StackOverflow and by ChatGPT, is that
[POSIX](https://en.wikipedia.org/wiki/POSIX) permits only **uppercase**
envvars, and everything else is undefined behavior.

But this is seriously **NOT**
[what the standard says](https://pubs.opengroup.org/onlinepubs/9699919799/):

> *These strings have the form name=value; names shall not contain the character
> '='. For values to be portable across systems conforming to POSIX.1-2017, the
> value shall be composed of characters from the portable character set (except
> NUL and as indicated below). There is no meaning associated with the order of
> strings in the environment. If more than one string in an environment of a
> process has the same name, the consequences are undefined.*
>
> *Environment variable names used by the utilities in the Shell and Utilities
> volume of POSIX.1-2017 consist solely of uppercase letters, digits, and the
> \<underscore\> ( '_' ) from the characters defined in Portable Character Set
> and do not begin with a digit. Other characters may be permitted by an
> implementation; applications shall tolerate the presence of such names.
> Uppercase and lowercase letters shall retain their unique identities and
> shall not be folded together. The name space of environment variable names
> containing lowercase letters is reserved for applications. Applications can
> define any environment variables with names from this name space without
> modifying the behavior of the standard utilities.*

Yes, POSIX-specified utilities use uppercase envvars, but that's not
*prescriptive* for your programs. Quite the contrary: you're *encouraged* to
use lowercase for your envvars so they don’t collide with the standard tools.

The only strict rule is that a variable name cannot contain an equals sign.
POSIX requires compliant applications to preserve all variables that conform to
this rule.

But in reality, not many applications use lowercase. The *proper etiquette* in
software development is to use `ALL_UPPERCASE`.

## My pragmatic recommendation is...

...to use `^[A-Z_][A-Z0-9_]*$` for names, and UTF-8 for values. You shouldn’t
hit problems on Linux. If you want to be super safe: instead of UTF-8, use the
POSIX-mandated [Portable Character Set
(PCS)](https://en.wikipedia.org/wiki/Portable_character_set) – essentially
ASCII without control characters.

{{<subscribe>}}

## Wow, I really enjoyed writing this...

...and I hope it wasn't a boring read.


