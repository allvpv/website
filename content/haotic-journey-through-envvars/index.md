+++
date = '2025-09-20'
draft = true
title = "Environment variables"
toc = false
+++

<!-- This is a draft. It should be ignored by Hugo, and not displayed on the website. -->
<!-- This is a draft. It should be ignored by Hugo, and not displayed on the website. -->
<!-- This is a draft. It should be ignored by Hugo, and not displayed on the website. -->
<!-- This is a draft. It should be ignored by Hugo, and not displayed on the website. -->
<!-- This is a draft. It should be ignored by Hugo, and not displayed on the website. -->
<!-- This is a draft. It should be ignored by Hugo, and not displayed on the website. -->
<!-- This is a draft. It should be ignored by Hugo, and not displayed on the website. -->

In software engineering, the new often meets the old, and some things never
change for decades. Even though programming languages have rapidly evolved, the
overall scaffolding that OS gives for running the processes has been pretty
much the same since the days of Unix.

In general, if you need to somehow parametrize your application at runtime by
passing a couple of ad-hoc variables (without creating temporary files or using
some custom IPC solution), forget about types, namespaces, or any kind of
modern interface.

> You have to use use an *environment variable*

I will call them *envvar* through the rest of the article for brevity.

Even a novice programmer is supposed to know what it is. They saw it at some
point, maybe during a local setup that required exporting the `SECRET_KEY`, or
when changing some deployment configuration.

So what really are those envvars? Is it some kind of a special
dictionary or map inside the operating system? If no, then who owns them and
how do they propagate? And what can be stored inside them?

Join me in exploring how envvars really work on Linux.


## Where do they come from?

In Linux, a program must use `execve` syscall to execute another program. When
typing `ls` in `bash`, as well as using `subprocess.run` in Python, or, at a
higher level, running your code editor, web browser -- it all comes down to
`execve`.

And `execve` takes three arguments:
- the executable path
- an array of command line arguments, and
- an array of environment variables.

So, for `ls -lah` invocation in the terminal:
- the 1st argument will be `/usr/bin/ls`,
- the 2nd argument will be the array of arguments: `['/usr/bin/ls', '-lah']`
  (the executable is usually the "zero" argument),
- and the 3rd argument will be, for example `['PATH=/usr/bin:/bin',
  'USER=allvpv']`. 

The default convention is to pass all envvars of the parent process. However,
nothing prevents the parent process from passing a completely different (or
even empty) set of envvars when using the `execve` system call!

By default, however, all tooling passes the environment down: `bash`, as well
as Python (when you use `subprocess.exec`), or C library `execl` function, etc.
And this is what you expect to happen: the variables are inherited by the child
processes. That's the point – to keep track of the *environment*.

> Which tools do *not* explicitly pass the environment down?
>
> For example, the `login` executable, which is used when signing onto a
> system, sets up a fresh environment for the child processes.


## Where are they going?

After running the new program, the kernel just dumps the variables to an array
on the stack. This static array cannot be easily modified. So the program would
then copy those variables to some modifiable data structure. That allows to
adjust the environment while you are running the program.

Let's explore what underlying structure is used for storing the environment
variables in some most essential programming tools/languages/frameworks.
Out of curiosity, I've checked the source code of them and came up with a
brief description.

### Bash

It stores the variables in a ***hashmap***. Or, to be more precise, in a
***stack of hashmaps*** – one hashmap for each scope. When you execute a
process inside `bash`, `bash` traverses the stack of hashmaps to check, which
variables are marked as environmental, and copies them into an array, which is
then passed to the child process.

> *Side note:* Why the stack is needed?
>
>  Each function invocation in `bash` creates a new local scope – a new entry
>  on the stack. If you declare your variable with `local`, it then ends up in
>  this locally-scoped hashmap.
>
> What's interesting is that you can export a `local` variable too – and it
> does not make it global! Rather, all subsequent processes executed inside
> this function will inherit this variable. (That is, it will be passed to them
> as an environment variable).
>
> I would never have learned this without diving into the source code of
> `bash`. My intuitive (wrong) assumption would be that `export`
> means – *make it global*! Super interesting stuff.

### The default C library on Linux: `glibc`

Creates a dynamic `environ` array; this array can be managed by `putenv` and
`getenv` library functions. Each `getenv` or `putenv` invocation is O(n), but
`n` is usually small.

### Python

On startup, the `os.environ` dictionary is built from the
`environ` array managed by the C library. Each change to `os.environ` calls the low-level,
natively implemented `os.putenv` function, which in turn, calls `putenv` from
the C library. So the C library is responsible for managing the “ground
truth” state of environment variables, which are passed to child processes.

  Note that the propagation is one-directional: modifying `os.environ` will
  call `os.putenv`, but not the other way around. Call `os.putenv`, and
  `os.environ` won't be updated.


## Liberal format

The Linux kernel, as well as the most popular standard C library on Linux -
`glibc` – is very liberal when it comes to the format of environment variables.

For example, your C program (if it uses `glibc`) can manipulate environment –
the global `environ` array – in such a way that you'll create several
environment variables with the same name but different value!

And when you execute a child process, it will also retain this "broken" setup!

You don't even need the equal sign, separating the name from the value! The
usual entry is `NAME=VALUE` (with the first equal sign separating the name from
the value) but nothing prevents you to add `NONSENSE_WITH_EMOJI 😀` to this
array. (Is it even a *variable* then, without a proper name and a value)?

So the kernel will happily accept any null-terminated string as an “environment
variable” definition. It just imposes a *size* limit:

- **Single** env var size (name + equal sign + value) [`PAGE_SIZE *
  32`](https://elixir.bootlin.com/linux/v2.6.24/source/include/linux/binfmts.h#L14).
  ~ 128Kb on a typical x64 Intel CPU.

- **Total** env vars + argv size: The calculation is a bit more complicated
  (see `execve(2)` man page). On my machine, it's 2MB.


## The standard format


But the fact that you can do something, does not mean that you should.

For example, if you execute `bash` with this "broken" setup – containing
duplicated names and invalid entries without the `=` separator – it will ignore
invalid entries and deduplicate the variables, taking into account the value of
the latest.

There are standards that should be .


<!-- ## How to properly get the current username in Bash script? -->
<!---->
<!-- Recently I had to review code with this one peculiar line: -->
<!---->
<!--     EVALUATOR_NAME="${USER:-$(whoami)}" -->
<!---->
<!-- My first question was: isn't it redundant? Why cannot we stick to either -->
<!-- `${USER}` or `$(whoami)`? If you struggle to understand this syntax let me -->
<!-- unpack it: `${USER}` resolves to the value of the environment variable called -->
<!-- `USER`, which – surprise! – should be set to your username. And `whoami` is a -->
<!-- binary that, when executed, that prints the current username. `$(...)` captures -->
<!-- command standard output, so `echo $(whomai)` is the same as `whoami` -->
<!---->
<!-- And `${VAR_NAME:-fallback_value}` is another bashism. If `VAR_NAME` is set and -->
<!-- non-empty, that the value of `VAR_NAME` is used here, otherwise it fallbacks to -->
<!-- `fallback_value`. -->
<!---->
<!-- So why cannot we stick to either `${USER}` or `$(whoami)`? If in your Linux -->
<!-- terminal you'll type: -->
<!---->
<!--     env -->
<!---->
<!-- then you'll see all environment variables listed. But no one is preventing you -->
<!-- to write: -->
<!---->
<!--     unset USER -->
<!---->
<!-- and `USER` is gone. -->


<!-- ## Another options -->
<!---->
<!-- Of course, it wouldn't be UNIX if there were only two options. `${USER}` and -->
<!-- `whoami` are probably most popular, but there is also: -->
<!---->
<!-- - `logname` -->
<!-- - `: \\u; echo "${_@P}"` if you are on fairly new Bash (4.4 or newer); yes, really! -->
<!--   I had no clue what it meant where I was it for the first time, but don't worry, -->
<!--   we dive into this. -->
<!-- - `${LOGNAME}` -->
<!-- - `who am i` (yup!) -->
<!-- - `id -un` -->
<!---->
<!-- and I am pretty sure that this list is not complete. -->



<!-- I recently started doing infra work at my current company, improving crumbling -->
<!-- infrastructue for AI-related services and tools. And sometimes I wonder, what -->
<!-- went wrong with the software world that in 2025 I still have to bother writing -->
<!-- `bash`! -->
<!-- Anyway, Bash is still around, and r -->
<!---->
<!-- You know what I mean. Clever one-or-two-or-ten-liners next to the Docker -->
<!-- `RUN` directive. `sh` spliced in the Jenkins pipelines. Full-blown startup -->
<!-- script inside the image. Plus tiny `local_setup.sh` in the repo to export env -->
<!-- vars. And so on. Bash is there and it's not going anywhere! -->
<!---->
<!-- Don't get me wrong, I looove writing bash! It's the same kind of love that I -->
<!-- have for Makefiles, Objective-C, or any kind of arcane retro tech. However, -->
<!-- arguing with someone (again!) that in their `for` loop they should use -->
<!-- `${array[@]}` (instead of the default split by whitespace) feels like -->
<!-- satisfying my inner nerd instead of doing actual productive work for my -->
<!-- `$CORP`. -->
<!---->
<!-- So why bash!? -->
<!---->
<!-- In theory, I can embed inside a Docker image a modern shell like, for example, -->
<!-- my beloved Nushell. But a new 40 Mb binary would raise some eyebrows. Plus it -->
<!-- would need to pass compliance and security audit. What's worse, AI is not able -->
<!-- to output 10 syntactically correct lines of Nushell. (This is a niche -->
<!-- technology, afterall). So using Nushell for infra would paralize my colleagues -->
<!-- and make them unable to collaborate: not everyone in my team is a Nushell -->
<!-- afficionado, afterall. (Shout out to our intern Krzysiek, who is)! And don't -->
<!-- even get me started about integration with external tools, like, for example, -->
<!-- embedding Nu inside Dockerfile. -->
<!---->
<!-- Compare this to `bash` and its cute little ELF -- 2MB statically linked. Jokes -->
<!-- aside, this binary is literally everywhere. I bet it is more widespread than -->
<!-- the famous "1 billion devices running Java". And, last but not least, AI is -->
<!-- super fluent in bash. (At least in comparison to us, mere mortals). -->
<!---->
<!-- And, in a nutshell, that's why bash sticks around. -->
<!---->

<!-- Sometimes I wonder, what went wrong with the software world that in 2025 I -->
<!-- still have to write `bash`. Anyway, it is still around, at least in my -->
<!-- `${CORP}`. And I need to write or review such code from time to time. -->
<!---->
<!-- You can learn horizontally, concept by concept, but you can also learn -->
<!-- vertically, trying to tackle one thing in depth. This article has one -->
<!-- theme: getting the current username in a Bash script. And everything -->
<!-- that follows from that. -->
<!---->
<!-- Recently I had to review code with this one peculiar line: -->
<!---->
<!--     EVALUATOR_NAME="${USER:-$(whoami)}" -->
<!---->
<!-- My first question was: isn't it redundant? -->
<!---->
<!-- If you struggle to understand this syntax let me unpack it: -->
<!---->
<!-- > On Linux, `${USER}` resolves to the value of the environment variable called -->
<!-- > `USER`, which – surprise! – should be set to your username. And `whoami` is a -->
<!-- > binary that, when executed, that prints the current username. `$(...)` captures -->
<!-- > command standard output, so `echo $(whomai)` is the same as `whoami`. -->
<!-- > -->
<!-- > And `${VAR_NAME:-fallback_value}` is another bashism. If `VAR_NAME` is set and -->
<!-- > non-empty, that the value of `VAR_NAME` is used here, otherwise it fallbacks to -->
<!-- > `fallback_value`. -->
<!---->
<!-- So why cannot we stick to either `${USER}` or `$(whoami)`? -->
<!---->
<!-- Anyway, that's what Cursor generated for my colleague, and I needed to review -->
<!-- it. I asked the LLM for a possible reasoning of why this was chosen, but the -->
<!-- answer was vague and non-convincing. -->
<!---->
<!-- And I went down the rabbit hole, doing a little bit of research  :) I will be -->
<!-- focusing on how it works on Linux. -->

<!-- ## Terrible code from AI assistants -->
<!---->
<!-- You probably noticed that AI coding tools (as for now) are doing a lot of -->
<!-- overzelaous, too defensive checks and fallbacks. I imagine that reinforcement -->
<!-- learning leads to that: models are heavily trained to complete the tasks -->
<!-- against automated checker, before their context window ends, so they try -->
<!-- everything to desperately “make it work”. There is no time to “tweak” the -->
<!-- solution iteratively, if you have limited memory, so it's always better -->
<!-- to do the validation multiple times than to miss it. -->
