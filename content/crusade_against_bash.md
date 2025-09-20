+++
date = '2025-09-23'
draft = true
title = "My failed crusade against `bash` and ${USER:-$(whoami)}"
subtitle = "${USER:-$(whoami)}: isn't it redundant?"
toc = false
+++

I recently started doing infra work at my current company, improving crumbling
infrastructue for AI-related services and tools. And sometimes I wonder, what
went wrong with the software world that in 2025 I still have to bother writing
scripts in `bash`!

You know what I mean. Clever one-or-two-or-ten-liners next to the Docker
`RUN` directive. `sh` spliced in the Jenkins pipelines. Full-blown startup
script inside the image. Plus tiny `local_setup.sh` in the repo to export env
vars. And so on. Bash is there and it's not going anywhere!

Don't get me wrong, I looove writing bash! It's the same kind of love that I
have for Makefiles, Objective-C, or any kind of arcane retro tech. However,
arguing with someone (again!) that in their `for` loop they should use
`${array[@]}` (instead of the default split by whitespace) feels like
satisfying my inner nerd instead of doing actual productive work for my
$CORP.

So why bash!?

Well.. you know the answer :)

In theory, I can embed inside a Docker image a modern shell like, for example,
my beloved Nushell. But a new 40 Mb binary would raise some eyebrows. Plus it
would need to pass compliance and security audit. What's worse, AI is not able
to output 10 syntactically correct lines of Nushell. (This is a niche
technology, afterall). So using Nushell for infra would paralize my colleagues
and make them unable to collaborate: not everyone in my team is a Nushell
afficionado, afterall. (Shout out to our intern Krzysiek, who is)! And don't
even get me started about integration with external tools, like, for example,
embedding Nu inside Dockerfile.

Compare this to `bash` and its cute little ELF – 2MB statically linked. Jokes
aside, this binary is literally everywhere. I bet it is more widespread than
the lauded "1 billion devices running Java". And, last but not least, AI is
super fluent in bash. (At least in comparison to us, mere mortals).

## Okay, to the point.

I recently had to review code with this one mysterious line:

```
EVALUATOR_NAME="${USER:-$(whoami)}"
```

If you struggle to understand this syntax let me unpack it.

In bash, `${USER}` resolves to the value of the variable called USER, which –
surprise! – is set to your UNIX username. Type `echo ${USER}` in your terminal,
and you will see. And `whoami` is almost like `echo ${USER}`: it's a bash
built-in command that prints the current UNIX username.

So `${USER:-$(whoami)}`, resolves to the value of USER, if it is set
and non-empty, and otherwise to the output of whoami.
