+++
date = '2025-09-20'
draft = true
title = "Haotic journey through environment variables"
subtitle = "Jump with me to the rabbit hole"
toc = false
+++

DRAFT DRAFT DRAFT

It's interesting how often in software engineering, the new meets the old.

Even if you are working with the newest, shiniest front-end framework, you
cannot deploy it without getting away without at least a couple of environment
variables. And here, the entire ugly world of UNIX legacy comes into play.

Join me in exploring how environment variables really work on Linux.


## Where they come from?

In Linux, a program must use `execve` syscall to execute another program. When
typing `ls` in `bash`, as well as using `subpreocess.exec` in Python, or
clicking the Browser icon from the Start Menu – it all comes down to the
`execve`.

And `execve` takes as argument an array of environment variables *for the
executed program*.

The default convention is to pass all environment variables of the parent
process. And that is what you expect: the variables are inherited from the
parent process, by the child process. That's the point, after all – to keep
track of the `environment`.

However, nothing prevents the parent process to pass completly different, or
even empty, set of env vars in call to `execve`! And it makes sense sometimes.
For example, the `login` executable, which is executed when you log into your
system, clears the environment by default.

But by default, essentially all tooling passes the environment down: `bash`, as
well as Python when you use `subprocess.exec`, or C library `execl` function,
etc.

## Where are they going?

After running the new program, the kernel just dumps the variables into an
array on the stack.

This static array cannot be easily modified, for example, to extend it
with one more variable. The layout in memory does not allow for that.

And that's why the program has to copy thos variables to some modifiable data
structure: so that you can adjust the environment while you are running the
program: the default C library on Linux – `glibc` -  uses a dynamic array. 
`bash` goes even further, and it stores the variables in a hash map. And so on. (python?)


## Liberal format

The Linux kernel, as well as the standard C library, is very liberal when it
comes to the format of environment variables.

For example, your C program (if it uses `glibc` standard library) can
manipulate environment – the global `environ` array – in such a way that you'll
create several environment variables with the same name but different value!

You don't even need the equal sign, separating the name from the value!
The usual entry is `NAME=VALUE`, but nothing prevents you to add
`NONSENSE_WITH_EMOJI 😀`

And when you execute a child process, it will also retain this "broken" setup!

However, if you then execute `bash` from the "broken" process, it will
deduplicate the variables, taking into account the value of the latest, and get
rid of the invalid entries.


## How to properly get the current username in Bash script?

Recently I had to review code with this one peculiar line:

    EVALUATOR_NAME="${USER:-$(whoami)}"

My first question was: isn't it redundant? Why cannot we stick to either
`${USER}` or `$(whoami)`? If you struggle to understand this syntax let me
unpack it: `${USER}` resolves to the value of the environment variable called
`USER`, which – surprise! – should be set to your username. And `whoami` is a
binary that, when executed, that prints the current username. `$(...)` captures
command standard output, so `echo $(whomai)` is the same as `whoami`

And `${VAR_NAME:-fallback_value}` is another bashism. If `VAR_NAME` is set and
non-empty, that the value of `VAR_NAME` is used here, otherwise it fallbacks to
`fallback_value`.

So why cannot we stick to either `${USER}` or `$(whoami)`? If in your Linux
terminal you'll type:

    env

then you'll see all environment variables listed. But no one is preventing you
to write:

    unset USER

and `USER` is gone.


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
