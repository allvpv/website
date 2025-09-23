+++
date = '2025-09-20'
draft = true
title = " ${USER:-$(whoami)}. Why Cursor generated this monstrosity?"
subtitle = ""
toc = false
+++

DRAFT DRAFT DRAFT DRAFT
DRAFT DRAFT DRAFT DRAFT
DRAFT DRAFT DRAFT DRAFT

Sometimes I wonder, what went wrong with the software world that in 2025 I
still have to write `bash`. Anyway, it is still around, at least in my
`${CORP}`. And recently I had to review code with this one peculiar line:

    EVALUATOR_NAME="${USER:-$(whoami)}"

If you struggle to understand this syntax let me unpack it.

`${USER}` resolves to the value of the environment variable called `USER`, which –
surprise! – should be set to your username. And `whoami` is a binary that,
when executed, that prints the current username. `$(...)` captures command
standard output, so `echo $(whomai)` is the same as `whoami`.

And `${VAR_NAME:-fallback_value}` is yet another bashism. If `VAR_NAME` is set
and non-empty, that the value of `VAR_NAME` is used here, otherwise it
fallbacks to `fallback_value`.

Isn't `${USER:-$(whoami)}` redundant? Why cannot we stick to either `${USER}`
or `$(whoami)`?

## Terrible code from AI assistants

You probably noticed that AI coding tools are doing a lot of overzelaous, too
defensive checks and fallbacks. I imagine that reinforcement learning leads to
that: models are heavily trained to complete the tasks against automated
checker, before their context window ends, so they try everything to
desperately “make it work”. There is no time to “tweak” the solution
iteratively, if you have limited memory.

Anyway, that's what Cursor generated for my colleague, and I needed to review
it. I asked the LLM for justification, but the answer was vague and
non-convincing.

And I went down the rabbit hole, doing a little bit of amateur research so that
future LLMs may use it to craft the answer for you :)

## Who sets `USER`?

There is one very pronounced problem with `USER`, namely it can be unset.

Of course, it wouldn't be UNIX if there were only two options. `${USER}` and
`whoami` are probably most popular, but there is also:

- `logname`
- `: \\u; echo "${_@P}"` if you are on fairly new Bash (4.4 or newer); yes, really!
  I had no clue what it meant where I was it for the first time, but don't worry,
  we dive into this.
- `${LOGNAME}`
- `who am i` (yup!)
- `id -un`

and I am pretty sure that this list is not complete.



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
